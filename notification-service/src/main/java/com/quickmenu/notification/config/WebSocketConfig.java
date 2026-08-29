package com.quickmenu.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocket / STOMP Configuration
 *
 * This mirrors the original monolith's WebSocketConfig.
 * Now it lives in its own service — WebSocket connections only go
 * to the notification-service, not the order-processing backend.
 *
 * This means:
 *  - A slow order placement doesn't delay WebSocket message delivery
 *  - You can scale notification-service separately (e.g., more WebSocket pods)
 *
 * Interview talking point:
 *  "We separated real-time delivery from business logic.
 *   The OrderService publishes a fire-and-forget event to RabbitMQ.
 *   The NotificationService independently manages all WebSocket sessions."
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // In-memory broker for /topic and /queue subscriptions
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix for @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Pure WebSocket endpoint (Postman / native STOMP clients)
        registry.addEndpoint("/websocket")
                .setAllowedOriginPatterns("*");

        // SockJS fallback for browsers that don't support WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
