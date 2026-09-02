package com.quickmenu.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Mirrors the OrderEvent published by backend's OrderService.
 *
 * @JsonIgnoreProperties(ignoreUnknown = true) means if the backend adds
 * new fields later, this service won't crash — resilient by design.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderEvent {

    private String eventType;    // ORDER_PLACED, STATUS_UPDATED, PAYMENT_VERIFIED, etc.
    private String orderId;
    private String restaurantId;
    private String tableId;
    private String status;
    private Object payload;      // the full enriched order map

    public OrderEvent() {}

    public String getEventType()    { return eventType; }
    public String getOrderId()      { return orderId; }
    public String getRestaurantId() { return restaurantId; }
    public String getTableId()      { return tableId; }
    public String getStatus()       { return status; }
    public Object getPayload()      { return payload; }

    public void setEventType(String eventType)       { this.eventType = eventType; }
    public void setOrderId(String orderId)           { this.orderId = orderId; }
    public void setRestaurantId(String restaurantId) { this.restaurantId = restaurantId; }
    public void setTableId(String tableId)           { this.tableId = tableId; }
    public void setStatus(String status)             { this.status = status; }
    public void setPayload(Object payload)           { this.payload = payload; }

    @Override
    public String toString() {
        return "OrderEvent{type=" + eventType + ", orderId=" + orderId
                + ", restaurantId=" + restaurantId + ", status=" + status + "}";
    }
}
