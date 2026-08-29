package com.quickmenu.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * OrderEvent — Shared event contract between Order Service and Notification Service.
 *
 * Design Principle: "Tolerant Reader"
 *  We use @JsonIgnoreProperties(ignoreUnknown = true) so that if the producer
 *  adds new fields in the future, this consumer won't break.
 *  This is a key principle in distributed systems — consumers should be
 *  resilient to schema evolution.
 *
 * Interview talking point:
 *  "We keep events immutable value objects. The payload field carries the
 *   full denormalized order data so the notification service never needs to
 *   call back into the order service. This avoids chatty inter-service communication."
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderEvent {

    /**
     * Event types — tells the consumer what happened
     */
    public enum EventType {
        ORDER_PLACED,       // New order (cash or online-verified)
        ORDER_STATUS_UPDATED, // Kitchen marked as PREPARING, READY, SERVED
        ORDER_PAYMENT_VERIFIED, // Stripe payment confirmed
        ORDER_ITEMS_APPENDED  // Customer added more items to existing order
    }

    private EventType eventType;
    private String orderId;
    private String restaurantId;
    private String tableId;
    private String status;

    /**
     * Full enriched order data — we send the complete payload so the notification
     * service doesn't need to make any HTTP calls back to order-service.
     * This pattern is called "Event-Carried State Transfer".
     */
    private Map<String, Object> payload;

    // ── Constructors ──────────────────────────────────────────────────────

    public OrderEvent() {}

    public OrderEvent(EventType eventType, String orderId, String restaurantId,
                      String tableId, String status, Map<String, Object> payload) {
        this.eventType = eventType;
        this.orderId = orderId;
        this.restaurantId = restaurantId;
        this.tableId = tableId;
        this.status = status;
        this.payload = payload;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getRestaurantId() { return restaurantId; }
    public void setRestaurantId(String restaurantId) { this.restaurantId = restaurantId; }

    public String getTableId() { return tableId; }
    public void setTableId(String tableId) { this.tableId = tableId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }

    @Override
    public String toString() {
        return "OrderEvent{eventType=" + eventType + ", orderId='" + orderId
                + "', restaurantId='" + restaurantId + "', status='" + status + "'}";
    }
}
