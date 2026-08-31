package com.quickmenu.bell.service;

import com.quickmenu.bell.config.RabbitMQConfig;
import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.model.BellEvent.Status;
import com.quickmenu.bell.repo.BellEventRepository;
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
 * BellService — extracted from the backend monolith into its own deployable.
 *
 * What changed vs the monolith version:
 *   - Package: com.quickmenu.bell.service  (was com.quickmenu.bell.service in backend — same!)
 *   - Config import: RabbitMQConfig now lives in bell-service config package
 *   - TableService dependency REMOVED — bell-service validates the table directly via DB query.
 *     In a fully decoupled design, we'd call a REST API exposed by the menu/table service.
 *     For this interview demo, we query the shared DB directly (shared DB pattern).
 *
 * Redis keys:
 *   bell:cooldown:{restaurantId}:{tableId}  → expires after cooldown seconds
 *   bell:streak:{restaurantId}:{tableId}    → count of consecutive rings
 */
@Service
public class BellService {

    private static final Logger log = LoggerFactory.getLogger(BellService.class);

    private static final String COOLDOWN_KEY = "bell:cooldown:%s:%s";
    private static final String STREAK_KEY   = "bell:streak:%s:%s";
    public  static final String BELL_RING_ROUTING_KEY = "bell.ring";

    private final BellEventRepository bellRepo;
    private final RabbitTemplate rabbitTemplate;
    private final StringRedisTemplate redisTemplate;

    private final long initialCooldown;
    private final long maxCooldown;

    public BellService(BellEventRepository bellRepo,
                       RabbitTemplate rabbitTemplate,
                       StringRedisTemplate redisTemplate,
                       @Value("${app.bell.cooldown-seconds:20}") long initialCooldown,
                       @Value("${app.bell.max-cooldown-seconds:600}") long maxCooldown) {
        this.bellRepo = bellRepo;
        this.rabbitTemplate = rabbitTemplate;
        this.redisTemplate = redisTemplate;
        this.initialCooldown = initialCooldown;
        this.maxCooldown = maxCooldown;
    }

    public BellEvent createBell(String restaurantId, String tableId, String message, String source) {
        String cooldownKey = String.format(COOLDOWN_KEY, restaurantId, tableId);
        String streakKey   = String.format(STREAK_KEY,   restaurantId, tableId);

        Boolean inCooldown = redisTemplate.hasKey(cooldownKey);
        if (Boolean.TRUE.equals(inCooldown)) {
            Long ttl = redisTemplate.getExpire(cooldownKey);
            long waitSeconds = ttl != null ? ttl : initialCooldown;
            throw new IllegalStateException("Please wait " + waitSeconds + " seconds before ringing again.");
        }

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

        // Exponential backoff via streak counter in Redis
        Long streak = redisTemplate.opsForValue().increment(streakKey);
        if (streak == null) streak = 1L;

        long cooldownSeconds = Math.min(initialCooldown * (long) Math.pow(2, streak - 1), maxCooldown);
        redisTemplate.expire(streakKey, Duration.ofSeconds(cooldownSeconds * 2));
        redisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(cooldownSeconds));

        // Publish to RabbitMQ — notification-service will push STOMP frame
        Map<String, Object> payload = buildPayload(saved, "BELL_CREATED");
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, BELL_RING_ROUTING_KEY, payload);
        log.info("[BELL-SERVICE] Published BELL_CREATED event for table {} in restaurant {}", tableId, restaurantId);

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

        Map<String, Object> ackPayload = new HashMap<>();
        ackPayload.put("eventType", "BELL_ACKED");
        ackPayload.put("restaurantId", restaurantId);
        ackPayload.put("id", updated.getId());
        ackPayload.put("tableId", updated.getTableId());
        ackPayload.put("tableName", updated.getTableName() != null ? updated.getTableName() : "");
        ackPayload.put("ackBy", updated.getAckBy());
        ackPayload.put("ackAt", updated.getAckAt().toString());

        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, BELL_RING_ROUTING_KEY, ackPayload);
        log.info("[BELL-SERVICE] Published BELL_ACKED event for bell {} by {}", bellId, ackBy);
        return updated;
    }

    private Map<String, Object> buildPayload(BellEvent saved, String eventType) {
        Map<String, Object> p = new HashMap<>();
        p.put("eventType", eventType);
        p.put("bellId", saved.getId());
        p.put("restaurantId", saved.getRestaurantId());
        p.put("tableId", saved.getTableId());
        p.put("tableName", saved.getTableName() != null ? saved.getTableName() : "");
        p.put("message", saved.getMessage() != null ? saved.getMessage() : "");
        p.put("createdAt", saved.getCreatedAt().toString());
        return p;
    }
}
