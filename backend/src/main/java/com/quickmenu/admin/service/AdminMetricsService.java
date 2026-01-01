package com.quickmenu.admin.service;

import com.quickmenu.admin.dto.MetricDtos;
import com.quickmenu.admin.dto.MetricDtos.HourlyDto;
import com.quickmenu.admin.dto.MetricDtos.TopDishDto;
import com.quickmenu.admin.dto.MetricDtos.CategoryStatDto;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.orders.repo.OrderItemRepository;
import com.quickmenu.orders.repo.OrderRepository;
import com.quickmenu.orders.model.Order;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminMetricsService {

    private final OrderItemRepository orderItemRepository;
    private final DishRepository dishRepository;
    private final OrderRepository orderRepository;

    public AdminMetricsService(OrderItemRepository orderItemRepository,
                               DishRepository dishRepository,
                               OrderRepository orderRepository) {
        this.orderItemRepository = orderItemRepository;
        this.dishRepository = dishRepository;
        this.orderRepository = orderRepository;
    }

    public MetricDtos.AdminMetricsResponse getMetrics(String restaurantId, Instant start, Instant end) {
        // Top dishes (limit 5)
        List<TopDishDto> topDishes = orderItemRepository.findTopDishesByRestaurant(restaurantId, start, end).stream()
                .map(proj -> {
                    String dishId = proj.getDishId();
                    var dish = dishRepository.findById(dishId);
                    String name = dish.map(d -> d.getName()).orElse("Unknown");
                    long qty = proj.getTotalQty() == null ? 0L : proj.getTotalQty();
                    BigDecimal revenue = proj.getTotalRevenue() == null ? BigDecimal.ZERO : proj.getTotalRevenue();
                    return new TopDishDto(dishId, name, qty, revenue);
                })
                .limit(5)
                .collect(Collectors.toList());

        // Hourly orders
        List<HourlyDto> hourly;
        try {
            // try DB-native aggregation (Postgres)
            List<Object[]> rows = orderRepository.hourlyOrdersBetween(restaurantId, start, end);
            Map<Instant, Long> map = new HashMap<>();
            for (Object[] row : rows) {
                // row[0] -> timestamp (depends on DB driver)
                Instant hourStart = ((java.sql.Timestamp) row[0]).toInstant();
                long cnt = ((Number) row[1]).longValue();
                map.put(hourStart, cnt);
            }
            // For arbitrary ranges, we just show returned buckets or we could fill gaps if needed.
            // Here we just map what we got, or maybe fill gaps between start and end?
            // Simple approach: just return what DB gave, frontend charts usually handle gaps or we fill 0s.
            // Let's fill 0s for every hour in the range if range < 48h?
            // For now, let's just return the list sorted.
            hourly = rows.stream().map(row -> {
                 Instant h = ((java.sql.Timestamp) row[0]).toInstant();
                 long c = ((Number) row[1]).longValue();
                 return new HourlyDto(h, c);
            }).collect(Collectors.toList());

        } catch (Exception ex) {
            // Fallback to in-memory grouping
            List<Order> recentOrders = orderRepository.findByRestaurantId(restaurantId).stream()
                    .filter(o -> o.getPlacedAt() != null && !o.getPlacedAt().isBefore(start) && !o.getPlacedAt().isAfter(end))
                    .collect(Collectors.toList());
            
            // Group by hour
            Map<Instant, Long> map = new HashMap<>();
            for (Order o : recentOrders) {
                Instant placed = o.getPlacedAt();
                // We need a ZoneId to truncate to hour properly? 
                // Actually the DB query used DATE_TRUNC which implies a timezone or UTC.
                // Let's use UTC for truncation consistency if fallback
                Instant hourTrunc = placed.truncatedTo(java.time.temporal.ChronoUnit.HOURS);
                map.merge(hourTrunc, 1L, Long::sum);
            }
             hourly = map.entrySet().stream()
                     .sorted(Map.Entry.comparingByKey())
                     .map(e -> new HourlyDto(e.getKey(), e.getValue()))
                     .collect(Collectors.toList());
        }

        // Category breakdown
        List<CategoryStatDto> catStats = orderItemRepository.findCategoryStatsByRestaurant(restaurantId, start, end).stream()
                .map(p -> new CategoryStatDto(
                        p.getCategoryId() == null ? "uncategorized" : p.getCategoryId(),
                        p.getCategoryName() == null ? "Others" : p.getCategoryName(),
                        p.getTotalQty() == null ? 0L : p.getTotalQty()
                ))
                .collect(Collectors.toList());

        return new MetricDtos.AdminMetricsResponse(topDishes, hourly, catStats);
    }

    private List<HourlyDto> buildHourlyListSince(Map<Instant, Long> map, Instant nowHourInstant, ZoneId zoneId) {
        List<HourlyDto> res = new ArrayList<>();
        // Build 24 hourly buckets ending at nowHourInstant
        ZonedDateTime nowZ = ZonedDateTime.ofInstant(nowHourInstant, zoneId);
        for (int i = 23; i >= 0; i--) {
            ZonedDateTime hour = nowZ.minusHours(i);
            Instant key = hour.toInstant();
            long cnt = map.getOrDefault(key, 0L);
            res.add(new HourlyDto(key, cnt));
        }
        return res;
    }
}
