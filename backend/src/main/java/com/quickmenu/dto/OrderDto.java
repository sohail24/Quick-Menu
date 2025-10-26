package com.quickmenu.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderDto {
    @Data
    public static class CreateOrderItem {
        private String dishId;
        private Integer quantity;
        private String note;
    }

    @Data
    public static class CreateOrderRequest {
        private String tableId;
        private String customerNote;
        private List<CreateOrderItem> items;
    }

    @Data
    public static class OrderResponse {
        private String id;
        private String restaurantId;
        private String tableId;
        private String status;
        private BigDecimal totalAmount;
        private List<OrderItemResponse> items;
    }

    @Data
    public static class OrderItemResponse {
        private String dishId;
        private Integer quantity;
        private BigDecimal priceAtOrder;
        private String note;
    }
}
