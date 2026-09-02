package com.quickmenu.notification.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Strips Access-Control-Allow-Origin headers produced by Spring WebSocket (SockJS).
 * Since the API Gateway handles CORS at the edge, notification-service must NOT
 * send its own CORS headers to avoid duplicate header errors in the browser.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsHeaderSuppressorFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        HttpServletResponseWrapper wrappedResponse = new HttpServletResponseWrapper(response) {
            @Override
            public void setHeader(String name, String value) {
                if ("Access-Control-Allow-Origin".equalsIgnoreCase(name) ||
                    "Access-Control-Allow-Credentials".equalsIgnoreCase(name)) {
                    return; // Ignore CORS headers emitted by SockJS internal handlers
                }
                super.setHeader(name, value);
            }

            @Override
            public void addHeader(String name, String value) {
                if ("Access-Control-Allow-Origin".equalsIgnoreCase(name) ||
                    "Access-Control-Allow-Credentials".equalsIgnoreCase(name)) {
                    return; // Ignore CORS headers emitted by SockJS internal handlers
                }
                super.addHeader(name, value);
            }
        };

        filterChain.doFilter(request, wrappedResponse);
    }
}
