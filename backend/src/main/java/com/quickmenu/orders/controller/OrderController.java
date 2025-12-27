package com.quickmenu.orders.controller;

import com.quickmenu.config.customExceptions.TableOccupiedException;
import com.quickmenu.menu.mapper.OrderMapper;
import com.quickmenu.orders.dto.OrderRequest;
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

        // Enforce specific sorting: Active > Completed, then by placedAt DESC
        // We use unsorted PageRequest because the @Query in repository handles the order
        Pageable pageable = PageRequest.of(page, size);

        Page<Order> p = orderRepository.findByFilters(restaurantId, status, startDate, endDate, pageable);

        Page<OrderDto.OrderResponse> dtoPage = p.map(OrderMapper::toResponse);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order", description = "Get order details (staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<OrderDto.OrderResponse> getOrder(@PathVariable String restaurantId, @PathVariable String orderId) {
        return orderRepository.findById(orderId)
                .filter(o -> restaurantId.equals(o.getRestaurantId()))
                .map(order -> ResponseEntity.ok(OrderMapper.toResponse(order)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{orderId}")
    @Operation(summary = "Update order", description = "Update order status (staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<OrderDto.OrderResponse> updateStatus(@PathVariable String restaurantId,
                                              @PathVariable String orderId,
                                              @RequestBody Order req) {
        Order updated = orderService.updateOrderStatus(restaurantId, orderId, req.getStatus());
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

        Page<Order> orders;
        if (status != null && search != null) {
            orders = orderRepository.findByRestaurantIdAndStatusAndSearch(restaurantId, status, search, pageable);
        } else if (status != null) {
            orders = orderRepository.findByRestaurantIdAndStatus(restaurantId, status, pageable);
        } else  {
            orders = orderRepository.findByRestaurantIdAndSearch(restaurantId, search, pageable);
        }

        Page<OrderDto.OrderResponse> dtoPage = orders.map(OrderMapper::toResponse);
        return ResponseEntity.ok(dtoPage);
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
