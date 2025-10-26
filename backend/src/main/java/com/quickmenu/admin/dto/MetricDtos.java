package com.quickmenu.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class MetricDtos {

    public static record TopDishDto(String dishId, String name, long totalQty, BigDecimal totalRevenue) {}

    public static record HourlyDto(Instant hourStart, long ordersCount) {}

    public static record AdminMetricsResponse(List<TopDishDto> topDishes, List<HourlyDto> hourlyOrders) {}
}
