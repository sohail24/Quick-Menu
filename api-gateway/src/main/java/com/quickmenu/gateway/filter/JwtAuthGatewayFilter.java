package com.quickmenu.gateway.filter;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Global reactive JWT filter for Spring Cloud Gateway.
 *
 * Runs BEFORE every request is forwarded to a downstream service.
 * Two checks per protected request:
 *   1. Redis blacklist lookup — O(1), rejects logged-out tokens immediately
 *   2. JWT signature validation — ensures token was issued by our backend
 *
 * Why this is better than checking in each microservice:
 *   "Cross-cutting concerns like auth belong at the gateway edge.
 *    Downstream services (backend, notification, bell) never see
 *    invalid or revoked tokens — they can trust incoming requests."
 */
@Component
public class JwtAuthGatewayFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthGatewayFilter.class);

    private final ReactiveStringRedisTemplate redisTemplate;
    private final SecretKey signingKey;

    // Paths that do NOT require a JWT token
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/logout",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/demo/**",
            "/api/health",
            "/actuator/**",
            "/ws/**",
            "/websocket/**"
    );

    // Paths that are public for specific HTTP methods only
    // (handled via AntPathMatcher against the full path)
    private static final List<String> PUBLIC_GET_PATTERNS = List.of(
            "/api/*/menu",
            "/api/*/menu/**",
            "/api/orders/**",
            "/api/restaurants/**"
    );

    private static final List<String> PUBLIC_POST_PATTERNS = List.of(
            "/api/*/orders",
            "/api/*/orders/*/verify",
            "/api/*/orders/*/items",
            "/api/*/orders/*/complete",
            "/api/restaurants/*/tables/*/bell"
    );

    private static final List<String> PUBLIC_DELETE_PATTERNS = List.of(
            "/api/*/orders/*/cancel"
    );

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtAuthGatewayFilter(
            ReactiveStringRedisTemplate redisTemplate,
            @Value("${jwt.secret}") String jwtSecret) {
        this.redisTemplate = redisTemplate;
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();
        String method = request.getMethod().name();

        // Always allow CORS preflight (OPTIONS) and public paths
        if ("OPTIONS".equalsIgnoreCase(method) || isPublicPath(path, method)) {
            return chain.filter(exchange);
        }

        // Extract Bearer token
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[GATEWAY] Missing or malformed Authorization header for: {} {}", method, path);
            return reject(exchange, HttpStatus.UNAUTHORIZED, "Missing authorization token");
        }

        String token = authHeader.substring(7);

        // Step 1: Check Redis blacklist REACTIVELY (non-blocking)
        String blacklistKey = "jwt:blacklist:" + token;
        return redisTemplate.hasKey(blacklistKey)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        log.warn("[GATEWAY] Blacklisted token attempted on: {} {}", method, path);
                        return reject(exchange, HttpStatus.UNAUTHORIZED, "Token has been revoked");
                    }

                    // Step 2: Validate JWT signature locally (no network call needed)
                    if (!validateToken(token)) {
                        log.warn("[GATEWAY] Invalid JWT signature on: {} {}", method, path);
                        return reject(exchange, HttpStatus.UNAUTHORIZED, "Invalid token");
                    }

                    log.debug("[GATEWAY] Authenticated request forwarded: {} {}", method, path);
                    return chain.filter(exchange);
                });
    }

    private boolean isPublicPath(String path, String method) {
        // Unconditionally public paths
        for (String pattern : PUBLIC_PATHS) {
            if (pathMatcher.match(pattern, path)) return true;
        }
        // Method-specific public paths
        if ("GET".equalsIgnoreCase(method)) {
            for (String pattern : PUBLIC_GET_PATTERNS) {
                if (pathMatcher.match(pattern, path)) return true;
            }
        }
        if ("POST".equalsIgnoreCase(method)) {
            for (String pattern : PUBLIC_POST_PATTERNS) {
                if (pathMatcher.match(pattern, path)) return true;
            }
        }
        if ("DELETE".equalsIgnoreCase(method)) {
            for (String pattern : PUBLIC_DELETE_PATTERNS) {
                if (pathMatcher.match(pattern, path)) return true;
            }
        }
        return false;
    }

    private boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Mono<Void> reject(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");
        var body = exchange.getResponse().bufferFactory()
                .wrap(("{\"status\":" + status.value() + ",\"error\":\"" + message + "\"}").getBytes());
        return exchange.getResponse().writeWith(Mono.just(body));
    }

    @Override
    public int getOrder() {
        // Run before all other filters (lower number = higher priority)
        return -1;
    }
}
