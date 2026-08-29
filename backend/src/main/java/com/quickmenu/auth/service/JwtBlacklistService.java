package com.quickmenu.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * JWT Blacklist Service
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Problem: JWT tokens are stateless — once issued, there's no server-side
 * "session" to invalidate. How do you implement logout in a JWT-based system?
 *
 * Solution: Token Blacklist in Redis
 *  - On logout, store the token in Redis with TTL = remaining token lifetime
 *  - The API Gateway checks the blacklist on every request (O(1) Redis GET)
 *  - When the token naturally expires, Redis automatically removes the key
 *  - No memory leak, no DB call, no state in the application
 *
 * Why Redis (not DB)?
 *  - Redis GET is ~0.1ms; PostgreSQL SELECT is ~5-10ms
 *  - The gateway handles every single request — this check must be ultra-fast
 *  - TTL management is built into Redis — we never need a cleanup job
 *
 * Interview talking point:
 *  "This is the standard approach for JWT logout in stateless distributed systems.
 *   The alternative — short token expiry + refresh tokens — also works, but still
 *   needs a blacklist for immediate revocation (e.g., account compromise scenario)."
 * ─────────────────────────────────────────────────────────────────────────
 */
@Service
public class JwtBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(JwtBlacklistService.class);
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;

    public JwtBlacklistService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Add a JWT token to the blacklist.
     *
     * @param token         The raw JWT string
     * @param remainingTtl  How long until the token would naturally expire
     *                      (we use this as the Redis TTL — no point storing it longer)
     */
    public void blacklist(String token, Duration remainingTtl) {
        String key = BLACKLIST_PREFIX + token;
        // Value doesn't matter — presence of key = blacklisted
        redisTemplate.opsForValue().set(key, "blacklisted", remainingTtl);
        log.info("[JWT_BLACKLIST] Token blacklisted with TTL: {}s", remainingTtl.getSeconds());
    }

    /**
     * Check if a token is blacklisted.
     * The gateway calls this — but we expose it here too for defense-in-depth.
     */
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }
}
