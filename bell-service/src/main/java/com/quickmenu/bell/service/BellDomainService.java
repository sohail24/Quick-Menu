package com.quickmenu.bell.service;

import com.quickmenu.bell.dto.BellEvent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class BellDomainService {

    private static final Logger log = LoggerFactory.getLogger(BellDomainService.class);

    private static final String EXCHANGE_NAME = "quickmenu.events";
    private static final String ROUTING_KEY_BELL_RING = "bell.ring";
    private static final String COOLDOWN_KEY_PREFIX = "bell:cooldown:";
    private static final String STREAK_KEY_PREFIX = "bell:streak:";

    private final RabbitTemplate rabbitTemplate;
    private final StringRedisTemplate redisTemplate;

    public BellDomainService(RabbitTemplate rabbitTemplate, StringRedisTemplate redisTemplate) {
        this.rabbitTemplate = rabbitTemplate;
        this.redisTemplate = redisTemplate;
    }

    public Map<String, Object> ringBell(String restaurantId, String tableId) {
        String cooldownKey = COOLDOWN_KEY_PREFIX + tableId;
        String streakKey = STREAK_KEY_PREFIX + tableId;

        // 1. Check Redis cooldown TTL key
        Boolean isCoolingDown = redisTemplate.hasKey(cooldownKey);
        if (Boolean.TRUE.equals(isCoolingDown)) {
            Long ttl = redisTemplate.getExpire(cooldownKey);
            log.warn("[BELL-SERVICE] Bell cooldown active for table: {}, remaining TTL: {}s", tableId, ttl);
            throw new RateLimitExceededException("Please wait " + (ttl != null ? ttl : 5) + " seconds before ringing again.");
        }

        // 2. Compute exponential cooldown
        Long currentStreakObj = redisTemplate.opsForValue().increment(streakKey);
        long streak = currentStreakObj != null ? currentStreakObj : 1;
        redisTemplate.expire(streakKey, Duration.ofMinutes(2)); // reset streak window after 2 mins of silence

        long cooldownSeconds = Math.min(5 * (long) Math.pow(2, streak - 1), 120);
        redisTemplate.opsForValue().set(cooldownKey, "LOCKED", Duration.ofSeconds(cooldownSeconds));

        // 3. Publish bell event to RabbitMQ
        String bellId = UUID.randomUUID().toString();
        BellEvent event = BellEvent.builder()
                .eventType("BELL_CREATED")
                .bellId(bellId)
                .restaurantId(restaurantId)
                .tableId(tableId)
                .createdAt(Instant.now())
                .build();

        rabbitTemplate.convertAndSend(EXCHANGE_NAME, ROUTING_KEY_BELL_RING, event);
        log.info("[BELL-SERVICE] Published bell event to RabbitMQ: bellId={}, tableId={}, cooldown={}s",
                bellId, tableId, cooldownSeconds);

        return Map.of(
                "success", true,
                "id", bellId,
                "timestamp", Instant.now().toString()
        );
    }

    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }
}
