package com.quickmenu.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * Mirrors the WebSocketConfig from the monolith exactly.
 *
 * /ws         → SockJS endpoint (used by browsers via the frontend)
 * /websocket  → pure WebSocket endpoint (used by Postman / direct STOMP clients)
 * /topic      → prefix for server-to-client push topics
 * /app        → prefix for client-to-server @MessageMapping methods (not used here, but kept for symmetry)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker handles subscriptions to /topic/... and /queue/...
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Pure WebSocket — for Postman or direct STOMP clients
        registry.addEndpoint("/websocket")
                .setAllowedOriginPatterns("*");

        // SockJS fallback — for browsers
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
