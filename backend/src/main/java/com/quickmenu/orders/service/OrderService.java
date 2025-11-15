package com.quickmenu.orders.service;

import com.quickmenu.orders.dto.OrderDto;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.model.OrderItem;
import com.quickmenu.orders.repo.OrderItemRepository;
import com.quickmenu.orders.repo.OrderRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DishRepository dishRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        DishRepository dishRepository,
                        SimpMessagingTemplate messagingTemplate) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.dishRepository = dishRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Order placeOrder(String restaurantId, OrderDto.CreateOrderRequest req) {
        // validate dishes and compute total
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (OrderDto.CreateOrderItem it : req.getItems()) {
            Dish dish = dishRepository.findById(it.getDishId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid dish: " + it.getDishId()));
            if (dish.getIsAvailable() == null || !dish.getIsAvailable()) {
                throw new IllegalArgumentException("Dish not available: " + dish.getName());
            }
            BigDecimal itemTotal = dish.getPrice().multiply(BigDecimal.valueOf(it.getQuantity()));
            total = total.add(itemTotal);

            OrderItem oi = OrderItem.builder()
                    .dishId(dish.getId())
                    .quantity(it.getQuantity())
                    .priceAtOrder(dish.getPrice())
                    .note(it.getNote())
                    .build();
            items.add(oi);
        }

        Order order = Order.builder()
                .restaurantId(restaurantId)
                .tableId(req.getTableId())
                .customerNote(req.getCustomerNote())
                .totalAmount(total)
                .status(Order.Status.PENDING)
                .build();

        Order saved = orderRepository.save(order);

        for (OrderItem it : items) {
            it.setOrderId(saved.getId());
            orderItemRepository.save(it);
        }

        // Send WebSocket event to staff subscribers: /topic/restaurants/{restaurantId}/orders
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders",
                new OrderEvent(saved.getId(), saved.getTableId(), "ORDER_CREATED"));

        return saved;
    }

    public List<Order> listOrders(String restaurantId, Order.Status status) {
        if (status == null) {
            return orderRepository.findByRestaurantId(restaurantId);
        } else {
            return orderRepository.findByRestaurantIdAndStatus(restaurantId, status);
        }
    }

    @Transactional
    public Order updateOrderStatus(String restaurantId, String orderId, Order.Status status) {
        Order ord = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        ord.setStatus(status);
        Order updated = orderRepository.save(ord);

        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders",
                new OrderEvent(updated.getId(), updated.getTableId(), "ORDER_UPDATED"));

        return updated;
    }

    // Simple event DTO
    public static record OrderEvent(String orderId, String tableId, String type) { }
}
