package com.quickmenu.bell.config;

import com.quickmenu.bell.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for bell-service.
 *
 * Simpler than the backend's SecurityConfig because:
 *   - No login/signup endpoints
 *   - The gateway already validated the JWT; bell-service just reads the claims
 *     from the token to establish SecurityContext for @PreAuthorize
 *
 * Public: POST bell ring (customers use this via QR code, no token)
 * Protected: GET /bells, PATCH /bells/{id}/ack (staff only — ADMIN or STAFF role)
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public: customers ring the bell (no auth)
                .requestMatchers(HttpMethod.POST, "/api/restaurants/*/tables/*/bell").permitAll()
                // Public: actuator health
                .requestMatchers("/actuator/**").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
