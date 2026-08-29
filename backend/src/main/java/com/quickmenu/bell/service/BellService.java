package com.quickmenu.bell.service;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.model.BellEvent.Status;
import com.quickmenu.bell.repo.BellEventRepository;
import com.quickmenu.config.RabbitMQProducerConfig;
import com.quickmenu.menu.service.TableService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * BellService — Domain service for the waiter-call feature.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MICROSERVICES CHANGES:
 *
 * 1. SimpMessagingTemplate → RabbitTemplate
 *    Same reasoning as OrderService — decoupled, async notification delivery.
 *
 * 2. In-Memory ConcurrentHashMap → Redis TTL Keys
 *    BEFORE: private final Map<String, BellUsage> usageRecords = new ConcurrentHashMap<>();
 *    PROBLEM: If you run 2 instances of backend (horizontal scaling), each has its OWN
 *             in-memory map → rate limiting doesn't work across instances!
 *
 *    AFTER: Redis keys with TTL
 *    - Key format: "bell:cooldown:{restaurantId}:{tableId}"
 *    - Key format: "bell:count:{restaurantId}:{tableId}"
 *    - Redis TTL automatically expires rate-limit keys → no cleanup code needed
 *    - Works correctly across all backend instances (distributed rate limiting)
 *
 *    Interview talking point:
 *    "Moving from in-memory state to Redis is a classic horizontal-scaling challenge.
 *     In-memory state is per-instance, but Redis is shared across all instances.
 *     This is the difference between stateful (bad for scaling) and stateless (good) services."
 * ─────────────────────────────────────────────────────────────────────────
 */
@Service
public class BellService {

    private static final Logger log = LoggerFactory.getLogger(BellService.class);

    // Redis key prefixes
    private static final String REDIS_LAST_RING_KEY = "bell:lastRing:";
    private static final String REDIS_COUNT_KEY     = "bell:count:";

    private final BellEventRepository bellRepo;
    private final RabbitTemplate rabbitTemplate;            // ← CHANGED: was SimpMessagingTemplate
    private final StringRedisTemplate redisTemplate;        // ← NEW: Redis for distributed rate limiting
    private final TableService tableService;

    private final long initialCooldown;
    private final long maxCooldown;
    private final long resetWindowMinutes;

    public BellService(BellEventRepository bellRepo,
                       RabbitTemplate rabbitTemplate,
                       StringRedisTemplate redisTemplate,
                       TableService tableService,
                       @Value("${app.bell.cooldown-seconds:20}") long initialCooldown,
                       @Value("${app.bell.max-cooldown-seconds:600}") long maxCooldown,
                       @Value("${app.bell.reset-window-minutes:5}") long resetWindowMinutes) {
        this.bellRepo = bellRepo;
        this.rabbitTemplate = rabbitTemplate;
        this.redisTemplate = redisTemplate;
        this.tableService = tableService;
        this.initialCooldown = initialCooldown;
        this.maxCooldown = maxCooldown;
        this.resetWindowMinutes = resetWindowMinutes;
    }

    /**
     * Create a bell event if not rate-limited.
     *
     * Rate limiting is now distributed via Redis:
     *  - "bell:lastRing:{key}"  → epoch seconds of last ring (TTL = resetWindow)
     *  - "bell:count:{key}"     → ring count (TTL = resetWindow)
     */
    public BellEvent createBell(String restaurantId, String tableId, String message, String source) {
        tableService.getTable(restaurantId, tableId);

        String key = restaurantId + ":" + tableId;
        String lastRingRedisKey = REDIS_LAST_RING_KEY + key;
        String countRedisKey    = REDIS_COUNT_KEY + key;

        Instant now = Instant.now();

        // Read distributed state from Redis
        String lastRingStr = redisTemplate.opsForValue().get(lastRingRedisKey);
        String countStr    = redisTemplate.opsForValue().get(countRedisKey);

        int count = (countStr != null) ? Integer.parseInt(countStr) : 0;
        Instant lastRingAt = (lastRingStr != null) ? Instant.ofEpochSecond(Long.parseLong(lastRingStr)) : null;

        // Check rate limit
        long currentCooldown = calculateCooldown(count);
        if (count > 0 && lastRingAt != null && now.isBefore(lastRingAt.plusSeconds(currentCooldown))) {
            long waitTime = lastRingAt.plusSeconds(currentCooldown).getEpochSecond() - now.getEpochSecond();
            throw new IllegalStateException("Please wait " + waitTime + " seconds before ringing again.");
        }

        // persist bell event
        BellEvent event = BellEvent.builder()
                .restaurantId(restaurantId)
                .tableId(tableId)
                .message(message)
                .source(source == null ? "QR" : source)
                .status(Status.PENDING)
                .createdAt(now)
                .delivered(false)
                .attempts(0)
                .build();

        BellEvent saved = bellRepo.save(event);

        // Update distributed rate-limit state in Redis
        Duration ttl = Duration.ofMinutes(resetWindowMinutes);
        redisTemplate.opsForValue().set(lastRingRedisKey, String.valueOf(now.getEpochSecond()), ttl);
        redisTemplate.opsForValue().set(countRedisKey, String.valueOf(count + 1), ttl);

        // Build the event payload (same structure the frontend expects)
        Map<String, Object> bellPayload = new HashMap<>();
        bellPayload.put("id", saved.getId());
        bellPayload.put("tableId", saved.getTableId());
        bellPayload.put("tableName", saved.getTableName() != null ? saved.getTableName() : "");
        bellPayload.put("message", saved.getMessage() != null ? saved.getMessage() : "");
        bellPayload.put("createdAt", saved.getCreatedAt().toString());
        bellPayload.put("type", "BELL_CREATED");

        // Publish bell event to RabbitMQ → notification-service pushes to WebSocket
        publishBellEvent("BELL_CREATED", saved, bellPayload);

        // Update delivery tracking
        try {
            saved.setDelivered(true);
            saved.setAttempts(saved.getAttempts() == null ? 1 : saved.getAttempts() + 1);
            bellRepo.save(saved);
        } catch (Exception ex) {
            log.warn("[BellService] Failed to update delivery tracking: {}", ex.getMessage());
        }

        return saved;
    }

    public BellEvent ackBell(String restaurantId, String bellId, String ackBy) {
        BellEvent e = bellRepo.findById(bellId)
                .filter(ev -> Objects.equals(ev.getRestaurantId(), restaurantId))
                .orElseThrow(() -> new IllegalArgumentException("Bell event not found"));

        e.setStatus(Status.ACKED);
        e.setAckBy(ackBy);
        e.setAckAt(Instant.now());
        BellEvent updated = bellRepo.save(e);

        // Build ack payload
        Map<String, Object> ackPayload = new HashMap<>();
        ackPayload.put("id", updated.getId());
        ackPayload.put("tableId", updated.getTableId());
        ackPayload.put("tableName", updated.getTableName() != null ? updated.getTableName() : "");
        ackPayload.put("type", "BELL_ACKED");
        ackPayload.put("ackBy", updated.getAckBy());
        ackPayload.put("ackAt", updated.getAckAt().toString());

        // Publish bell ack event to RabbitMQ
        publishBellEvent("BELL_ACKED", updated, ackPayload);

        return updated;
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private long calculateCooldown(int count) {
        if (count <= 0) return 0;
        // 20, 40, 80, 160... (exponential backoff)
        long cooldown = initialCooldown * (long) Math.pow(2, count - 1);
        return Math.min(cooldown, maxCooldown);
    }

    /**
     * Publish a bell event to RabbitMQ.
     * Routing key "bell.ring" / "bell.ack" — matches "bell.#" binding on notification queue.
     */
    private void publishBellEvent(String eventType, BellEvent saved, Map<String, Object> payload) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", eventType);
            event.put("bellId", saved.getId());
            event.put("restaurantId", saved.getRestaurantId());
            event.put("tableId", saved.getTableId());
            event.put("payload", payload);

            String routingKey = "BELL_CREATED".equals(eventType)
                    ? RabbitMQProducerConfig.BELL_RING
                    : RabbitMQProducerConfig.BELL_ACK;

            rabbitTemplate.convertAndSend(RabbitMQProducerConfig.EXCHANGE, routingKey, event);
            log.info("[BellService] Published {} event for bellId={}", eventType, saved.getId());
        } catch (Exception ex) {
            // Non-critical — bell was saved, notification is best-effort
            log.error("[BellService] Failed to publish bell event to RabbitMQ: {}", ex.getMessage());
        }
    }
}
