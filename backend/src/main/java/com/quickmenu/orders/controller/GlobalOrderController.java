package com.quickmenu.orders.controller;

import com.quickmenu.menu.mapper.OrderMapper;
import com.quickmenu.orders.dto.OrderDto;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.repo.OrderRepository;
import com.quickmenu.orders.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GlobalOrderController {
    private final OrderRepository orderRepository;

    public GlobalOrderController(OrderService orderService, OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/api/orders/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable String orderId,
                                          @RequestHeader(value = "X-Order-Token", required = false) String orderToken) {
        return orderRepository.findById(orderId)
                .map(order -> {
                    // Check if current user is Staff/Admin OR if the orderToken matches
                    boolean isStaffOrAdmin = false;
                    org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null) {
                        isStaffOrAdmin = auth.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
                    }

                    if (!isStaffOrAdmin && (order.getOrderToken() != null && !order.getOrderToken().equals(orderToken))) {
                        return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                                .body(java.util.Map.of("message", "Access denied: Invalid order token"));
                    }
                    return ResponseEntity.ok(OrderMapper.toResponse(order));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

}
