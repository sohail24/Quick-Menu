package com.quickmenu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable a simple in-memory broker that handles subscriptions to /topic and /queue
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages bound for methods annotated with @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // ✅ Pure WebSocket endpoint (for Postman or direct STOMP clients)
        registry.addEndpoint("/websocket")
                .setAllowedOriginPatterns("*"); // No SockJS fallback here

        // ✅ SockJS endpoint for browsers
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
