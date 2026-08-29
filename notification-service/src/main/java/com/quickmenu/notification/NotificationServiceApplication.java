package com.quickmenu.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Notification Microservice
 *
 * Responsibilities:
 *  - Consume OrderEvent and BellEvent messages from RabbitMQ (AMQP)
 *  - Push real-time notifications to browser clients via STOMP WebSocket
 *
 * Why this is a separate service (Microservices Interview Point):
 *  - Single Responsibility Principle: this service's ONLY job is real-time delivery
 *  - Horizontal Scalability: can be scaled independently of order processing
 *  - Fault Isolation: if WebSocket connections spike, only this service is stressed
 *  - Loose Coupling: OrderService doesn't know who handles notifications
 */
@SpringBootApplication
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
