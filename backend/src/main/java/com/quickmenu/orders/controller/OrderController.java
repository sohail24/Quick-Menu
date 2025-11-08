package com.quickmenu.orders.controller;

import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.repo.OrderRepository;
import com.quickmenu.orders.service.OrderService;
import com.quickmenu.dto.OrderDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/{restaurantId}/orders")
@Tag(name = "Orders", description = "Customer orders and staff order management")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public OrderController(OrderService orderService, OrderRepository orderRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
    }

    @PostMapping
    @Operation(summary = "Place order", description = "Place an order for a table (customer).")
    public ResponseEntity<?> placeOrder(@PathVariable String restaurantId,
                                        @RequestBody OrderDto.CreateOrderRequest req) {
        Order saved = orderService.placeOrder(restaurantId, req);
        return ResponseEntity.status(201).body(saved);
    }

    @GetMapping
    @Operation(summary = "List orders", description = "List orders for staff (paginated, filterable by status).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Page<Order>> listOrders(@PathVariable String restaurantId,
                                                  @RequestParam(required = false) Order.Status status,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size,
                                                  @RequestParam(defaultValue = "placedAt") String[] sort) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));

        Page<Order> p = (status == null)
                ? orderRepository.findByRestaurantId(restaurantId, pageable)
                : orderRepository.findByRestaurantIdAndStatus(restaurantId, status, pageable);

        return ResponseEntity.ok(p);
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order", description = "Get order details (staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Order> getOrder(@PathVariable String restaurantId, @PathVariable String orderId) {
        return orderRepository.findById(orderId)
                .filter(o -> restaurantId.equals(o.getRestaurantId()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{orderId}")
    @Operation(summary = "Update order", description = "Update order status (staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Order> updateStatus(@PathVariable String restaurantId,
                                              @PathVariable String orderId,
                                              @RequestBody Order req) {
        Order updated = orderService.updateOrderStatus(restaurantId, orderId, req.getStatus());
        return ResponseEntity.ok(updated);
    }

    private Sort.Order[] parseSort(String[] sort) {
        return java.util.Arrays.stream(sort)
                .map(s -> {
                    String[] parts = s.split(",");
                    String prop = parts[0].trim();
                    Sort.Direction dir = parts.length > 1 ? Sort.Direction.fromString(parts[1].trim()) : Sort.Direction.ASC;
                    return new Sort.Order(dir, prop);
                }).toArray(Sort.Order[]::new);
    }
}
