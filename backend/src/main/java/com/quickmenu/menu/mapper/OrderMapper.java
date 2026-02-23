package com.quickmenu.menu.mapper;

import com.quickmenu.orders.dto.OrderDto;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.model.OrderItem;

public class OrderMapper {

    public static OrderDto.OrderResponse toResponse(Order order) {
        OrderDto.OrderResponse dto = new OrderDto.OrderResponse();
        dto.setId(order.getId());
        dto.setRestaurantId(order.getRestaurantId());
        dto.setTableId(order.getTableId());
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setCustomerNote(order.getCustomerNote());
        dto.setStatus(order.getStatus().name());
        dto.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "CASH");
        dto.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PENDING");
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPlacedAt(order.getPlacedAt());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream()
                    .map(OrderMapper::toItemResponse)
                    .toList());
        }

        return dto;
    }

    public static OrderDto.OrderItemResponse toItemResponse(OrderItem item) {
        OrderDto.OrderItemResponse dto = new OrderDto.OrderItemResponse();
        dto.setDishId(item.getDish().getId());
        
        // Use snapshot name if available, otherwise fallback (safely)
        String name = item.getDishName();
        if (name == null) {
            try {
                name = item.getDish().getName();
            } catch (jakarta.persistence.EntityNotFoundException e) {
                name = "Deleted Dish";
            } catch (Exception e) {
                name = "Unknown Dish";
            }
        }
        dto.setDishName(name);

        dto.setQuantity(item.getQuantity());
        dto.setPriceAtOrder(item.getPriceAtOrder());
        dto.setNote(item.getNote());
        return dto;
    }
}
