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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public Map<String, Object> placeOrder(String restaurantId, OrderDto.CreateOrderRequest req) {
        // find table row with pessimistic lock (for concurrency) or check occupied flag
        TableEntity table = tableRepository.findByIdForUpdate(req.getTableId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid table"));

        if (Boolean.TRUE.equals(table.getOccupied())) {
            throw new TableOccupiedException();
        }

        // mark table occupied
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
                    .dish(dish)
                    .quantity(it.getQuantity())
                    .priceAtOrder(dish.getPrice())
                    .note(it.getNote())
                    .build();
            items.add(oi);
        }

        // build order and set back-reference on items
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

        // set the parent reference on each item
        for (OrderItem it : items) {
            it.setOrder(order);
        }

        // save order; cascade will save items automatically
        Order saved = orderRepository.save(order);

        Map<String, Object> orderPayload = enrichOrderForResponse(saved);
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders", orderPayload);

        return orderPayload;
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

        // Free the table if order is SERVED
        if (Order.Status.SERVED.equals(status)) {
            TableEntity table = tableRepository.findById(updated.getTableId())
                    .orElse(null);
            if (table != null) {
                table.setOccupied(false);
                tableRepository.save(table);
            }
        }

        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/orders",
                new OrderEvent(updated.getId(), updated.getTableId(), "ORDER_UPDATED"));

        return updated;
    }

    // Simple event DTO
    public static record OrderEvent(String orderId, String tableId, String type) { }


    /**
     * Enrich order with item details (dishName, etc.)
     * Used for API responses and STOMP messages
     */
    public Map<String, Object> enrichOrderForResponse(Order order) {
        List<Map<String, Object>> itemsWithDetails = order.getItems() != null
                ? order.getItems().stream()
                .map(item -> {
                    Dish dish = dishRepository.findById(item.getDish().getId()).orElse(null);
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("id", item.getId());
                    itemMap.put("dishId", item.getDish().getId());
                    itemMap.put("dishName", dish != null ? dish.getName() : "Unknown Dish");
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("priceAtOrder", item.getPriceAtOrder());
                    itemMap.put("note", item.getNote() != null ? item.getNote() : "");
                    return itemMap;
                })
                .collect(Collectors.toList())
                : List.of();

        return Map.of(
                "id", order.getId(),
                "tableId", order.getTableId(),
                "status", order.getStatus().toString(),
                "placedAt", order.getPlacedAt().toString(),
                "customerName", order.getCustomerName() != null ? order.getCustomerName() : "",
                "customerPhone", order.getCustomerPhone() != null ? order.getCustomerPhone() : "",
                "totalAmount", order.getTotalAmount(),
                "items", itemsWithDetails
        );
    }
}
