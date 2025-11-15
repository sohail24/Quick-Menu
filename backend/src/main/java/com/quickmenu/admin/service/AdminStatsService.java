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

    public StatsDto getTodayStats(String restaurantId, ZoneId zoneId) {
        // calculate start/end for "today" in the restaurant timezone
        LocalDate today = LocalDate.now(zoneId);
        Instant start = today.atStartOfDay(zoneId).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(zoneId).toInstant().minusMillis(1);

        long ordersToday = orderRepository.countByRestaurantIdAndPlacedAtBetween(restaurantId, start, end);
        BigDecimal revenueToday = orderRepository.sumTotalAmountByRestaurantIdAndPlacedAtBetween(restaurantId, start, end);

        return new StatsDto(ordersToday, revenueToday);
    }

    public record StatsDto(long ordersToday, BigDecimal revenueToday) {}
}
