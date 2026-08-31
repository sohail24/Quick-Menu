package com.quickmenu.bell.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * JWT filter for bell-service.
 *
 * Note: The gateway has ALREADY validated this token and checked the Redis blacklist.
 * This filter's job is narrower — just parse the JWT claims to populate the
 * SecurityContext so @PreAuthorize("hasRole('ADMIN')") works in BellAdminController.
 *
 * We do NOT check Redis blacklist here because:
 *   1. The gateway already rejected blacklisted tokens before they reach us
 *   2. bell-service doesn't need a Redis dependency just for this purpose
 *      (it uses Redis for rate limiting, but that's a separate concern)
 *
 * Interview point: "Defense-in-depth would mean checking the blacklist here too.
 * For this demo, we trust the gateway as the security perimeter."
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final SecretKey signingKey;

    public JwtAuthFilter(@Value("${jwt.secret}") String jwtSecret) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(signingKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String role = claims.get("role", String.class);
                String subject = claims.getSubject();

                List<SimpleGrantedAuthority> authorities = role != null
                        ? List.of(new SimpleGrantedAuthority(role))
                        : List.of();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(subject, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (Exception e) {
                // invalid token — let SecurityFilterChain reject the request
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
