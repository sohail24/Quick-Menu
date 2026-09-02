package com.quickmenu.notification.listener;

import com.quickmenu.notification.config.RabbitMQConfig;
import com.quickmenu.notification.dto.BellEvent;
import com.quickmenu.notification.dto.OrderEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Listens to RabbitMQ queues and pushes STOMP WebSocket frames to connected browsers.
 *
 * This is the ONLY class that touches SimpMessagingTemplate in this service.
 * The backend (OrderService) no longer calls SimpMessagingTemplate directly —
 * it publishes to RabbitMQ and this service handles the push asynchronously.
 *
 * Why this matters (interview answer):
 *   "OrderService's HTTP response no longer waits for WebSocket delivery.
 *    They are decoupled. If notification-service is down, the order still saves
 *    and the message queues in RabbitMQ until the service recovers."
 */
@Component
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);

    private final SimpMessagingTemplate messagingTemplate;

    public OrderEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Listens to the orders queue.
     * Routing keys that land here: order.placed.cash, order.placed.online, order.status.*
     */
    @RabbitListener(queues = RabbitMQConfig.ORDERS_QUEUE)
    public void handleOrderEvent(OrderEvent event) {
        log.info("[NOTIFICATION] Received order event: type={}, orderId={}, restaurantId={}",
                event.getEventType(), event.getOrderId(), event.getRestaurantId());

        if (event.getRestaurantId() == null) {
            log.warn("[NOTIFICATION] Order event missing restaurantId — skipping push");
            return;
        }

        String topic = "/topic/restaurants/" + event.getRestaurantId() + "/orders";

        // Push the full payload (the enriched order map) to all subscribed browsers
        Object pushPayload = event.getPayload() != null ? event.getPayload() : event;
        messagingTemplate.convertAndSend(topic, pushPayload);

        log.info("[NOTIFICATION] Pushed order event to STOMP topic: {}", topic);
    }

    /**
     * Listens to the bells queue.
     * Routing key: bell.ring
     * Currently: published by BellService in the backend monolith.
     * Day 2: will be published by the standalone bell-service.
     */
    @RabbitListener(queues = RabbitMQConfig.BELLS_QUEUE)
    public void handleBellEvent(BellEvent event) {
        log.info("[NOTIFICATION] Received bell event: type={}, bellId={}, restaurantId={}, tableId={}",
                event.getEventType(), event.getBellId(), event.getRestaurantId(), event.getTableId());

        if (event.getRestaurantId() == null) {
            log.warn("[NOTIFICATION] Bell event missing restaurantId — skipping push");
            return;
        }

        String topic = "/topic/restaurants/" + event.getRestaurantId() + "/bells";
        messagingTemplate.convertAndSend(topic, event);

        log.info("[NOTIFICATION] Pushed bell event to STOMP topic: {}", topic);
    }
}
