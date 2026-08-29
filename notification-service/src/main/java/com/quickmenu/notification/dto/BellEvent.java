package com.quickmenu.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * BellEvent — Event published by the backend when a customer rings the bell.
 *
 * Contains the full bell payload so notification-service can push directly
 * to the restaurant's WebSocket topic without any back-calls.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BellEvent {

    public enum EventType {
        BELL_CREATED,  // Customer rang the bell
        BELL_ACKED     // Staff acknowledged the bell
    }

    private EventType eventType;
    private String bellId;
    private String restaurantId;
    private String tableId;
    private String tableName;
    private String message;
    private String createdAt;
    private String ackBy;
    private String ackAt;

    // Full payload for WebSocket push
    private Map<String, Object> payload;

    // ── Constructors ──────────────────────────────────────────────────────

    public BellEvent() {}

    public BellEvent(EventType eventType, String bellId, String restaurantId,
                     String tableId, Map<String, Object> payload) {
        this.eventType = eventType;
        this.bellId = bellId;
        this.restaurantId = restaurantId;
        this.tableId = tableId;
        this.payload = payload;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getBellId() { return bellId; }
    public void setBellId(String bellId) { this.bellId = bellId; }

    public String getRestaurantId() { return restaurantId; }
    public void setRestaurantId(String restaurantId) { this.restaurantId = restaurantId; }

    public String getTableId() { return tableId; }
    public void setTableId(String tableId) { this.tableId = tableId; }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getAckBy() { return ackBy; }
    public void setAckBy(String ackBy) { this.ackBy = ackBy; }

    public String getAckAt() { return ackAt; }
    public void setAckAt(String ackAt) { this.ackAt = ackAt; }

    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }
}
