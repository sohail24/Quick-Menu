package com.quickmenu.orders.controller;

import com.quickmenu.dto.OrderDto;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/{restaurantId}/orders")
public class OrderController {

    private final OrderService orderService;
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@PathVariable String restaurantId,
                                        @RequestBody OrderDto.CreateOrderRequest req) {
        Order saved = orderService.placeOrder(restaurantId, req);
        return ResponseEntity.status(201).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<Order>> listOrders(@PathVariable String restaurantId,
                                                  @RequestParam(required = false) Order.Status status) {
        return ResponseEntity.ok(orderService.listOrders(restaurantId, status));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable String restaurantId, @PathVariable String orderId) {
        // For now just fetch by id (service could validate restaurantId)
        return orderService.listOrders(restaurantId, null).stream()
                .filter(o -> o.getId().equals(orderId))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{orderId}")
    public ResponseEntity<Order> updateStatus(@PathVariable String restaurantId,
                                              @PathVariable String orderId,
                                              @RequestBody Order req) {
        Order updated = orderService.updateOrderStatus(restaurantId, orderId, req.getStatus());
        return ResponseEntity.ok(updated);
    }
}
