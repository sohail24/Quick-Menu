package com.quickmenu.admin.service;

import com.quickmenu.orders.repo.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.*;

@Service
public class AdminStatsService {

    private final OrderRepository orderRepository;

    public AdminStatsService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public StatsDto getStats(String restaurantId, Instant start, Instant end) {
        long ordersToday = orderRepository.countByRestaurantIdAndPlacedAtBetween(restaurantId, start, end);
        BigDecimal revenueToday = orderRepository.sumTotalAmountByRestaurantIdAndPlacedAtBetween(restaurantId, start, end);

        return new StatsDto(ordersToday, revenueToday);
    }

    public record StatsDto(long ordersToday, BigDecimal revenueToday) {}
}
