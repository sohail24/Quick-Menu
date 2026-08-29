package com.quickmenu.notification.listener;

import com.quickmenu.notification.config.RabbitMQConfig;
import com.quickmenu.notification.dto.OrderEvent;
import com.quickmenu.notification.dto.BellEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * OrderEventListener — The core of the Notification Microservice
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Flow:
 *   1. OrderService (backend) places an order
 *   2. Instead of calling SimpMessagingTemplate directly, it publishes to RabbitMQ
 *   3. This listener picks up the message (decoupled, async)
 *   4. Pushes it via STOMP to connected browser clients
 *
 * Why this matters for interviews:
 *  "Before microservices: if the WebSocket broker was slow or had 10,000 connections,
 *   it would slow down the order placement HTTP response.
 *   After: OrderService responds in <50ms. Notification delivery is async and independent."
 *
 * Failure Handling:
 *  If this service crashes, RabbitMQ holds messages in the durable queue.
 *  When it restarts, messages are replayed — guaranteed at-least-once delivery.
 *  Failed messages after max retries go to the Dead Letter Queue (DLQ).
 * ─────────────────────────────────────────────────────────────────────────
 */
@Component
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);

    private final SimpMessagingTemplate messagingTemplate;

    public OrderEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Listens on the orders queue.
     * RabbitMQ routes messages with routing keys matching "order.#" here.
     *
     * @RabbitListener is Spring's annotation-driven message consumer.
     * The Jackson2JsonMessageConverter (configured in RabbitMQConfig) automatically
     * deserializes the JSON body into an OrderEvent object.
     */
    @RabbitListener(queues = RabbitMQConfig.ORDERS_QUEUE)
    public void handleOrderEvent(OrderEvent event) {
        log.info("[NOTIFICATION] Received order event: type={}, orderId={}, restaurantId={}",
                event.getEventType(), event.getOrderId(), event.getRestaurantId());

        try {
            // Push to the restaurant's STOMP topic
            // Browser clients subscribed to this topic receive the update instantly
            String destination = "/topic/restaurants/" + event.getRestaurantId() + "/orders";
            Object payloadToSend = event.getPayload() != null ? event.getPayload() : event;
            messagingTemplate.convertAndSend(destination, payloadToSend);

            log.info("[NOTIFICATION] Pushed order event to STOMP topic: {}", destination);
        } catch (Exception ex) {
            log.error("[NOTIFICATION] Failed to push order event via WebSocket: {}", ex.getMessage(), ex);
            // Re-throwing causes RabbitMQ to nack → message goes to DLQ after max retries
            throw new RuntimeException("WebSocket push failed", ex);
        }
    }

    /**
     * Listens on the bells queue.
     * RabbitMQ routes messages with routing keys matching "bell.#" here.
     *
     * Bell events (waiter calls) are completely decoupled from order processing.
     * This is the Bounded Context isolation in action.
     */
    @RabbitListener(queues = RabbitMQConfig.BELLS_QUEUE)
    public void handleBellEvent(BellEvent event) {
        log.info("[NOTIFICATION] Received bell event: type={}, bellId={}, restaurantId={}, tableId={}",
                event.getEventType(), event.getBellId(), event.getRestaurantId(), event.getTableId());

        try {
            String destination = "/topic/restaurants/" + event.getRestaurantId() + "/bells";
            Object payloadToSend = event.getPayload() != null ? event.getPayload() : event;
            messagingTemplate.convertAndSend(destination, payloadToSend);

            log.info("[NOTIFICATION] Pushed bell event to STOMP topic: {}", destination);
        } catch (Exception ex) {
            log.error("[NOTIFICATION] Failed to push bell event via WebSocket: {}", ex.getMessage(), ex);
            throw new RuntimeException("WebSocket push failed", ex);
        }
    }
}
