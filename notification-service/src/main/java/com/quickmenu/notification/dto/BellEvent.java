package com.quickmenu.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * BellEvent DTO — received from RabbitMQ when a table rings for a waiter.
 * Currently published by BellService in the backend monolith (Day 1).
 * Will be published by the standalone bell-service in Day 2.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BellEvent {

    private String eventType;    // BELL_CREATED, BELL_ACKED
    private String bellId;
    private String restaurantId;
    private String tableId;
    private String tableName;
    private String message;
    private String createdAt;

    public BellEvent() {}

    public String getEventType()    { return eventType; }
    public String getBellId()       { return bellId; }
    public String getRestaurantId() { return restaurantId; }
    public String getTableId()      { return tableId; }
    public String getTableName()    { return tableName; }
    public String getMessage()      { return message; }
    public String getCreatedAt()    { return createdAt; }

    public void setEventType(String eventType)       { this.eventType = eventType; }
    public void setBellId(String bellId)             { this.bellId = bellId; }
    public void setRestaurantId(String restaurantId) { this.restaurantId = restaurantId; }
    public void setTableId(String tableId)           { this.tableId = tableId; }
    public void setTableName(String tableName)       { this.tableName = tableName; }
    public void setMessage(String message)           { this.message = message; }
    public void setCreatedAt(String createdAt)       { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return "BellEvent{type=" + eventType + ", bellId=" + bellId
                + ", restaurantId=" + restaurantId + ", tableId=" + tableId + "}";
    }
}
