package com.quickmenu.admin.service;

import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.repo.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;

@Service
public class AdminStatsService {

    private final OrderRepository orderRepository;
    private final com.quickmenu.menu.repo.TableRepository tableRepository;

    public AdminStatsService(OrderRepository orderRepository, com.quickmenu.menu.repo.TableRepository tableRepository) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
    }

    public StatsDto getStats(String restaurantId, Instant start, Instant end) {
        long ordersToday = orderRepository.countByRestaurantIdAndPlacedAtBetween(restaurantId, start, end);
        BigDecimal revenueToday = orderRepository.sumTotalAmountByRestaurantIdAndPlacedAtBetween(restaurantId, start, end);
        long activeTables = tableRepository.countByRestaurantIdAndOccupiedTrue(restaurantId);
        long availableTables = tableRepository.countByRestaurantIdAndOccupiedFalse(restaurantId);
        
        List<Order.Status> activeStatuses = List.of(
            Order.Status.PLACED, 
            Order.Status.PENDING, 
            Order.Status.PREPARING, 
            Order.Status.READY
        );
        long activeOrders = orderRepository.countByRestaurantIdAndStatusIn(restaurantId, activeStatuses);

        return new StatsDto(ordersToday, revenueToday, activeTables, availableTables, activeOrders);
    }

    public record StatsDto(
        long ordersToday, 
        BigDecimal revenueToday, 
        long activeTables, 
        long availableTables,
        long activeOrders
    ) {}
}
