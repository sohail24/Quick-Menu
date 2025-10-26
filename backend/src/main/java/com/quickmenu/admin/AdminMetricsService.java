package com.quickmenu.admin;

import com.quickmenu.admin.dto.MetricDtos.HourlyDto;
import com.quickmenu.admin.dto.MetricDtos.TopDishDto;
import com.quickmenu.admin.dto.MetricDtos.AdminMetricsResponse;
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

    public AdminMetricsResponse getMetrics(String restaurantId, ZoneId zoneId) {
        // Top dishes (limit 5)
        List<TopDishDto> topDishes = orderItemRepository.findTopDishesByRestaurant(restaurantId).stream()
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

        // Hourly orders (last 24 hours)
        ZonedDateTime now = ZonedDateTime.now(zoneId).withMinute(0).withSecond(0).withNano(0);
        ZonedDateTime sinceZdt = now.minusHours(23); // include current hour + previous 23 = 24 hours
        Instant sinceInstant = sinceZdt.toInstant();

        List<HourlyDto> hourly;
        try {
            // try DB-native aggregation (Postgres)
            List<Object[]> rows = orderRepository.hourlyOrdersSince(restaurantId, sinceInstant);
            Map<Instant, Long> map = new HashMap<>();
            for (Object[] row : rows) {
                // row[0] -> timestamp (depends on DB driver)
                Instant hourStart = ((java.sql.Timestamp) row[0]).toInstant();
                long cnt = ((Number) row[1]).longValue();
                map.put(hourStart, cnt);
            }
            hourly = buildHourlyListSince(map, now.toInstant(), zoneId);
        } catch (Exception ex) {
            // Fallback to in-memory grouping (works on H2)
            List<Order> recentOrders = orderRepository.findByRestaurantId(restaurantId).stream()
                    .filter(o -> o.getPlacedAt() != null && o.getPlacedAt().isAfter(sinceInstant))
                    .collect(Collectors.toList());
            Map<Instant, Long> map = new HashMap<>();
            for (Order o : recentOrders) {
                Instant placed = o.getPlacedAt();
                ZonedDateTime z = placed.atZone(zoneId).withMinute(0).withSecond(0).withNano(0);
                map.merge(z.toInstant(), 1L, Long::sum);
            }
            hourly = buildHourlyListSince(map, now.toInstant(), zoneId);
        }

        return new AdminMetricsResponse(topDishes, hourly);
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
