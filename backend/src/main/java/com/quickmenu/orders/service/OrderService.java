package com.quickmenu.orders.service;

import com.quickmenu.bell.service.BellService;
import com.quickmenu.config.WebSocketConfig;
import com.quickmenu.config.customExceptions.TableOccupiedException;
import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.repo.TableRepository;
import com.quickmenu.orders.dto.OrderDto;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.orders.dto.OrderRequest;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.model.OrderItem;
import com.quickmenu.orders.repo.OrderItemRepository;
import com.quickmenu.orders.repo.OrderRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final DishRepository dishRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TableRepository tableRepository;
    private final BellService bellService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        DishRepository dishRepository,
                        SimpMessagingTemplate messagingTemplate,
                        TableRepository tableRepository,
                        BellService bellService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.dishRepository = dishRepository;
        this.messagingTemplate = messagingTemplate;
        this.tableRepository = tableRepository;
        this.bellService = bellService;
    }

    @Transactional
    public Order placeOrder(String restaurantId, OrderDto.CreateOrderRequest req) {
        // find table row with pessimistic lock (for concurrency) or check occupied flag
        TableEntity table = tableRepository.findByIdForUpdate(req.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid table"));

        if (Boolean.TRUE.equals(table.getOccupied())) {
            throw new TableOccupiedException();
        }

        // mark table occupied (optional: you may mark occupied only when order is accepted/paid)
        table.setOccupied(true);
        tableRepository.save(table);

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
                .customerName(req.getCustomerName())
                .customerPhone(req.getCustomerPhone())
                .customerNote(req.getCustomerNote())
                .totalAmount(total)
                .status(Order.Status.PLACED)
                .items(items)
                .build();

        Order saved = orderRepository.save(order);

        for (OrderItem it : items) {
            it.setOrderId(saved.getId());
            orderItemRepository.save(it);
        }

        // Send WebSocket event to staff subscribers: /topic/restaurants/{restaurantId}/orders
        var orderPayload = Map.of(
                "id", saved.getId(),
                "tableId", saved.getTableId(),
                "status", saved.getStatus().toString(),
                "placedAt", saved.getPlacedAt().toString(),
                "customerName", saved.getCustomerName() != null ? saved.getCustomerName() : "",
                "customerPhone", saved.getCustomerPhone() != null ? saved.getCustomerPhone() : "",
                "totalAmount", saved.getTotalAmount(),
                "items", saved.getItems() != null ? saved.getItems() : List.of()
        );
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders", orderPayload);

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
