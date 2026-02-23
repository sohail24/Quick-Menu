package com.quickmenu.orders.controller;

import com.quickmenu.config.customExceptions.TableOccupiedException;
import com.quickmenu.menu.mapper.OrderMapper;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.repo.OrderRepository;
import com.quickmenu.orders.service.OrderService;
import com.quickmenu.orders.dto.OrderDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
        // basic validation
        if (req.getItems() == null || req.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Order must contain at least one item"));
        }
        if (req.getTableId() == null || req.getTableId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Table selection is required"));
        }
        if (req.getCustomerName() == null || req.getCustomerName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer name is required"));
        }
        if (req.getCustomerPhone() == null || req.getCustomerPhone().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer phone is required"));
        }

        // Check table availability — do this atomically in service layer
        try {
            Map<String, Object> saved = orderService.placeOrder(restaurantId, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (TableOccupiedException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Selected table is currently occupied"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Internal error"));
        }
    }

    @GetMapping
    @Operation(summary = "List orders", description = "List orders for staff (paginated, filterable by status and date).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Page<OrderDto.OrderResponse>> listOrders(
            @PathVariable String restaurantId,
            @RequestParam(required = false) Order.Status status,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // Enforce specific sorting: Active > Completed (via statusPriority formula), then by placedAt DESC
        java.util.List<Sort.Order> orders = new java.util.ArrayList<>();
        orders.add(new Sort.Order(Sort.Direction.ASC, "statusPriority"));
        orders.add(new Sort.Order(Sort.Direction.DESC, "placedAt"));
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(orders));

        org.springframework.data.jpa.domain.Specification<Order> spec = com.quickmenu.orders.repo.OrderSpecification.withFilters(restaurantId, status, startDate, endDate);
        Page<Order> p = orderRepository.findAll(spec, pageable);

        Page<OrderDto.OrderResponse> dtoPage = p.map(OrderMapper::toResponse);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order", description = "Get order details (staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<OrderDto.OrderResponse> getOrder(@PathVariable String restaurantId, @PathVariable String orderId) {
        return orderRepository.findById(orderId)
                .filter(o -> restaurantId.equals(o.getRestaurantId()))
                .filter(o -> o.getPaymentMethod() == Order.PaymentMethod.CASH || o.getPaymentStatus() == Order.PaymentStatus.PAID)
                .map(order -> ResponseEntity.ok(OrderMapper.toResponse(order)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{orderId}")
    @Operation(summary = "Update order", description = "Update order status (staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<OrderDto.OrderResponse> updateStatus(@PathVariable String restaurantId,
                                              @PathVariable String orderId,
                                              @RequestBody OrderDto.UpdateOrderRequest req) {
        Order.Status status = req.getStatus() != null ? Order.Status.valueOf(req.getStatus().toUpperCase()) : null;
        Order.PaymentStatus paymentStatus = req.getPaymentStatus() != null ? Order.PaymentStatus.valueOf(req.getPaymentStatus().toUpperCase()) : null;
        
        Order updated = orderService.updateOrderStatus(restaurantId, orderId, status, paymentStatus);
        return ResponseEntity.ok(OrderMapper.toResponse(updated));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Page<OrderDto.OrderResponse>> searchOrders(
            @PathVariable String restaurantId,
            @RequestParam String search,
            @RequestParam(required = false) Order.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "placedAt"));

        // Use Specification to ensure ghost orders are filtered out even in search
        org.springframework.data.jpa.domain.Specification<Order> spec = com.quickmenu.orders.repo.OrderSpecification.withFilters(restaurantId, status, null, null);
        
        // Add search criteria to specification if possible, or just keep it simple for now as it's a staff search
        // For now, let's just make it consistent with listOrders but with the search term
        if (search != null && !search.isBlank()) {
            final String searchLower = search.toLowerCase();
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("id")), "%" + searchLower + "%"),
                    cb.like(cb.lower(root.get("customerName")), "%" + searchLower + "%"),
                    cb.like(cb.lower(root.get("customerPhone")), "%" + searchLower + "%")
                )
            );
        }

        Page<Order> p = orderRepository.findAll(spec, pageable);
        Page<OrderDto.OrderResponse> dtoPage = p.map(OrderMapper::toResponse);
        return ResponseEntity.ok(dtoPage);
    }

    @PostMapping("/{orderId}/verify")
    @Operation(summary = "Verify payment", description = "Verify Stripe PaymentIntent.")
    public ResponseEntity<?> verifyPayment(@PathVariable String restaurantId,
                                           @PathVariable String orderId,
                                           @RequestBody OrderDto.StripeVerifyRequest req) {
        try {
            Map<String, Object> verified = orderService.verifyPayment(restaurantId, orderId, req);
            return ResponseEntity.ok(verified);
        } catch (TableOccupiedException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Table was taken while you were paying. Your payment has been voided. Please try again with a different table."));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel order", description = "Clean up unpaid online order.")
    public ResponseEntity<?> cancelOrder(@PathVariable String restaurantId,
                                         @PathVariable String orderId) {
        try {
            orderService.cancelOrder(restaurantId, orderId);
            return ResponseEntity.ok().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
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
