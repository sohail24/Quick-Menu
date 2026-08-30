package com.quickmenu.bell.service;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.model.BellEvent.Status;
import com.quickmenu.bell.repo.BellEventRepository;
import com.quickmenu.config.RabbitMQProducerConfig;
import com.quickmenu.menu.service.TableService;
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
 * BellService — refactored to use Redis + RabbitMQ.
 *
 * TWO problems solved vs. the original:
 *
 * 1. Cooldown was in-memory (ConcurrentHashMap):
 *    - Lost on restart
 *    - Each backend instance had its own separate map — two instances = bypass the rate limit
 *    - Fixed: Redis TTL key "bell:cooldown:{restaurantId}:{tableId}" shared across all instances
 *
 * 2. Notification was via SimpMessagingTemplate (direct WebSocket):
 *    - Tight coupling — BellService had to know about WebSocket
 *    - Fixed: Publish a BellEvent to RabbitMQ "bell.ring" routing key
 *      notification-service consumes it and pushes the STOMP frame
 */
@Service
public class BellService {

    // Redis key pattern: bell:cooldown:{restaurantId}:{tableId}
    private static final String COOLDOWN_KEY  = "bell:cooldown:%s:%s";
    // Tracks how many times the bell was rung in the current window
    private static final String STREAK_KEY    = "bell:streak:%s:%s";

    // RabbitMQ routing key — notification-service binds "bell.ring" to its queue
    public static final String BELL_RING_ROUTING_KEY = "bell.ring";

    private final BellEventRepository bellRepo;
    private final RabbitTemplate rabbitTemplate;
    private final StringRedisTemplate redisTemplate;
    private final TableService tableService;

    private final long initialCooldown;
    private final long maxCooldown;

    public BellService(BellEventRepository bellRepo,
                       RabbitTemplate rabbitTemplate,
                       StringRedisTemplate redisTemplate,
                       TableService tableService,
                       @Value("${app.bell.cooldown-seconds:20}") long initialCooldown,
                       @Value("${app.bell.max-cooldown-seconds:600}") long maxCooldown) {
        this.bellRepo = bellRepo;
        this.rabbitTemplate = rabbitTemplate;
        this.redisTemplate = redisTemplate;
        this.tableService = tableService;
        this.initialCooldown = initialCooldown;
        this.maxCooldown = maxCooldown;
    }

    /**
     * Ring the bell for a table.
     *
     * Rate limiting logic (now in Redis):
     *   - "bell:cooldown:{restaurantId}:{tableId}" key exists  → still in cooldown → reject
     *   - Key absent → allow, save bell, publish to RabbitMQ, set cooldown TTL
     *   - "bell:streak:{restaurantId}:{tableId}" tracks consecutive rings → exponential backoff TTL
     */
    public BellEvent createBell(String restaurantId, String tableId, String message, String source) {
        tableService.getTable(restaurantId, tableId);

        String cooldownKey = String.format(COOLDOWN_KEY, restaurantId, tableId);
        String streakKey   = String.format(STREAK_KEY, restaurantId, tableId);

        // Check cooldown: if key exists in Redis, the table is still in cooldown
        Boolean inCooldown = redisTemplate.hasKey(cooldownKey);
        if (Boolean.TRUE.equals(inCooldown)) {
            Long ttl = redisTemplate.getExpire(cooldownKey);
            long waitSeconds = ttl != null ? ttl : initialCooldown;
            throw new IllegalStateException("Please wait " + waitSeconds + " seconds before ringing again.");
        }

        // Persist the bell event to DB
        BellEvent event = BellEvent.builder()
                .restaurantId(restaurantId)
                .tableId(tableId)
                .message(message)
                .source(source == null ? "QR" : source)
                .status(Status.PENDING)
                .createdAt(Instant.now())
                .delivered(false)
                .attempts(0)
                .build();
        BellEvent saved = bellRepo.save(event);

        // Increment streak counter (how many consecutive rings in this window)
        // INCR is atomic in Redis — safe under concurrent load
        Long streak = redisTemplate.opsForValue().increment(streakKey);
        if (streak == null) streak = 1L;

        // Calculate exponential backoff cooldown based on streak count
        // Ring 1 → 20s, Ring 2 → 40s, Ring 3 → 80s … capped at maxCooldown
        long cooldownSeconds = Math.min(initialCooldown * (long) Math.pow(2, streak - 1), maxCooldown);

        // Set cooldown TTL — when this key expires, the next ring is allowed
        redisTemplate.expire(streakKey, Duration.ofSeconds(cooldownSeconds * 2));
        redisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(cooldownSeconds));

        // Publish to RabbitMQ instead of pushing WebSocket directly.
        // notification-service consumes "bell.ring" and pushes the STOMP frame.
        Map<String, Object> bellPayload = buildBellPayload(saved, "BELL_CREATED");
        rabbitTemplate.convertAndSend(RabbitMQProducerConfig.EXCHANGE, BELL_RING_ROUTING_KEY, bellPayload);

        saved.setDelivered(true);
        saved.setAttempts(1);
        bellRepo.save(saved);

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

        // Ack is also published via RabbitMQ so notification-service can push BELL_ACKED
        Map<String, Object> ackPayload = new HashMap<>();
        ackPayload.put("eventType", "BELL_ACKED");
        ackPayload.put("restaurantId", restaurantId);
        ackPayload.put("id", updated.getId());
        ackPayload.put("tableId", updated.getTableId());
        ackPayload.put("tableName", updated.getTableName() != null ? updated.getTableName() : "");
        ackPayload.put("ackBy", updated.getAckBy());
        ackPayload.put("ackAt", updated.getAckAt().toString());

        rabbitTemplate.convertAndSend(RabbitMQProducerConfig.EXCHANGE, BELL_RING_ROUTING_KEY, ackPayload);

        return updated;
    }

    private Map<String, Object> buildBellPayload(BellEvent saved, String eventType) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", eventType);
        payload.put("bellId", saved.getId());
        payload.put("restaurantId", saved.getRestaurantId());
        payload.put("tableId", saved.getTableId());
        payload.put("tableName", saved.getTableName() != null ? saved.getTableName() : "");
        payload.put("message", saved.getMessage() != null ? saved.getMessage() : "");
        payload.put("createdAt", saved.getCreatedAt().toString());
        return payload;
    }
}
