package com.quickmenu.orders.controller;

import com.quickmenu.menu.mapper.OrderMapper;
import com.quickmenu.orders.dto.OrderDto;
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.repo.OrderRepository;
import com.quickmenu.orders.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GlobalOrderController {
    private final OrderRepository orderRepository;

    public GlobalOrderController(OrderService orderService, OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/api/orders/{orderId}")
    public ResponseEntity<OrderDto.OrderResponse> getOrderById(@PathVariable String orderId) {
        return orderRepository.findById(orderId)
                .map(order -> ResponseEntity.ok(OrderMapper.toResponse(order)))
                .orElse(ResponseEntity.notFound().build());
    }

}
