package com.quickmenu.gateway.filter;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * JWT Authentication Global Filter
 *
 * -------------------------------------------------------------------------
 * This is a GlobalFilter - it runs on EVERY request through the gateway.
 *
 * Pipeline:
 *   Client Request
 *     -> [JwtAuthGatewayFilter]  <-- we are here
 *         | extract token
 *         | validate signature (JJWT, same secret as backend)
 *         | check Redis blacklist (token revoked after logout?)
 *         | pass claims downstream in X-User-* headers
 *     -> Route to backend / notification-service
 *
 * Security Architecture Interview Points:
 *  1. "Stateless JWT validation - gateway verifies signature locally, no auth-service call"
 *  2. "Redis blacklist - on logout, token is stored in Redis with TTL = remaining token lifetime"
 *     "Gateway checks blacklist per request - O(1) Redis GET is faster than a DB lookup"
 *  3. "Claims forwarding - once validated, we pass user ID and role as headers"
 *     "Downstream services trust these headers because they can't be set by external clients"
 *     "(In prod, use mTLS or signed headers between gateway and services)"
 *
 * Public endpoints (no token required):
 *  - POST /api/auth/... (login, register)
 *  - GET  /api/.../menu/... (public menu browsing)
 *  - POST /api/.../orders (place order - customer is unauthenticated)
 *  - POST /api/restaurants/.../tables/.../bell (bell ring via QR code)
 *  - /ws/..., /websocket/... (WebSocket handshake)
 * -------------------------------------------------------------------------
 */
@Component
public class JwtAuthGatewayFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthGatewayFilter.class);

    // Redis key prefix for JWT blacklist
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    // Public paths - no auth required
    private static final Set<String> PUBLIC_PATH_PREFIXES = Set.of(
            "/api/auth/",
            "/api/demo/",
            "/api/health",
            "/v3/api-docs",
            "/swagger-ui",
            "/actuator",
            "/favicon.ico"
    );

    private final SecretKey jwtKey;
    private final ReactiveStringRedisTemplate redisTemplate;

    public JwtAuthGatewayFilter(
            @Value("${jwt.secret}") String jwtSecret,
            ReactiveStringRedisTemplate redisTemplate) {
        this.jwtKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Skip auth for public endpoints
        if (isPublicEndpoint(path, method)) {
            return chain.filter(exchange);
        }

        // 2. Extract Bearer token
        String token = resolveToken(request);
        if (!StringUtils.hasText(token)) {
            log.warn("[GATEWAY] No token for protected path: {}", path);
            return unauthorized(exchange);
        }

        // 3. Validate JWT signature and expiry
        Claims claims;
        try {
            claims = Jwts.parser()
                    .verifyWith(jwtKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("[GATEWAY] Invalid JWT: {}", e.getMessage());
            return unauthorized(exchange);
        }

        // 4. Check Redis blacklist (reactive - non-blocking)
        //    Key: "jwt:blacklist:{token}" - set on logout with TTL = remaining token lifetime
        String blacklistKey = BLACKLIST_PREFIX + token;

        return redisTemplate.hasKey(blacklistKey)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        log.warn("[GATEWAY] Blacklisted token attempt for user: {}", claims.getSubject());
                        return unauthorized(exchange);
                    }

                    // 5. Forward validated claims as headers to downstream services
                    //    Downstream services can trust these without re-parsing the JWT
                    ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                            .header("X-User-Id", claims.getSubject())
                            .header("X-User-Email", claims.get("email", String.class))
                            .header("X-User-Role", claims.get("role", String.class))
                            .build();

                    log.debug("[GATEWAY] Authenticated user: {}, path: {}",
                            claims.getSubject(), path);

                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                });
    }

    /**
     * Check if the endpoint is public (no JWT required).
     * Mirrors the permit rules in the backend's SecurityConfig.
     */
    private boolean isPublicEndpoint(String path, HttpMethod method) {
        // Auth, docs, health
        for (String prefix : PUBLIC_PATH_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }

        // WebSocket handshake
        if (path.startsWith("/ws/") || path.startsWith("/websocket/")) return true;

        // Public GET endpoints (menu browsing, order status)
        if (HttpMethod.GET.equals(method)) {
            if (path.matches(".*/menu.*")) return true;
            if (path.matches(".*/orders.*")) return true;
            if (path.matches(".*/restaurants.*")) return true;
        }

        // Customer actions (no auth needed - they arrive via QR code)
        if (HttpMethod.POST.equals(method)) {
            if (path.matches(".*/orders$")) return true;
            if (path.matches(".*/orders/.*/verify.*")) return true;
            if (path.matches(".*/orders/.*/items")) return true;
            if (path.matches(".*/orders/.*/complete")) return true;
            if (path.matches(".*/tables/.*/bell")) return true;
        }

        if (HttpMethod.DELETE.equals(method)) {
            if (path.matches(".*/orders/.*/cancel")) return true;
        }

        return false;
    }

    private String resolveToken(ServerHttpRequest request) {
        List<String> authHeaders = request.getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String bearer = authHeaders.get(0);
            if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
                return bearer.substring(7);
            }
        }
        return null;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        // Run before routing (-1 ensures it runs before the default RoutePredicateHandlerMapping)
        return -1;
    }
}
