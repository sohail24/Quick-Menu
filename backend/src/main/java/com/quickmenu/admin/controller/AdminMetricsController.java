package com.quickmenu.admin.controller;

import com.quickmenu.admin.dto.MetricDtos.AdminMetricsResponse;
import com.quickmenu.admin.service.AdminMetricsService;
import com.quickmenu.admin.service.AdminStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin metrics and stats")
public class AdminMetricsController {

    private final AdminMetricsService metricsService;

    private final AdminStatsService statsService;

    public AdminMetricsController(AdminMetricsService metricsService, AdminStatsService statsService) {
        this.metricsService = metricsService;
        this.statsService = statsService;
    }

    @GetMapping("/metrics")
    @Operation(summary = "Admin metrics - top dishes & hourly breakdown", description = "Returns top 5 dishes & hourly breakdown. Defaults to last 24h if no dates provided.")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getMetrics(@RequestParam String restaurantId,
                                        @RequestParam(required = false) String timezone,
                                        @RequestParam(required = false) String startDate,
                                        @RequestParam(required = false) String endDate) {
        ZoneId zone = timezone == null ? ZoneId.of("UTC") : ZoneId.of(timezone);
        
        System.out.println("getMetrics request: rid=" + restaurantId + " start=" + startDate + " end=" + endDate);

        java.time.Instant start = null;
        java.time.Instant end = null;

        if (startDate != null && !startDate.isBlank()) start = java.time.Instant.parse(startDate);
        if (endDate != null && !endDate.isBlank()) end = java.time.Instant.parse(endDate);

        if (start == null && end == null) {
             // Default: last 24 hours
             java.time.ZonedDateTime now = java.time.ZonedDateTime.now(zone).withMinute(0).withSecond(0).withNano(0);
             end = now.plusHours(1).toInstant(); 
             start = now.minusHours(23).toInstant(); 
        } else {
             if (end == null) end = java.time.Instant.now();
             if (start == null) start = end.minus(1, java.time.temporal.ChronoUnit.DAYS);
        }

        AdminMetricsResponse resp = metricsService.getMetrics(restaurantId, start, end);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/stats")
    @Operation(summary = "Admin stats", description = "Simple stats (orders count and revenue). Defaults to 'Today' if dates not provided.")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStats(@RequestParam String restaurantId,
                                      @RequestParam(required = false) String timezone,
                                      @RequestParam(required = false) String startDate,
                                      @RequestParam(required = false) String endDate) {
        ZoneId zone = timezone == null ? ZoneId.of("UTC") : ZoneId.of(timezone);
        
        System.out.println("getStats request: rid=" + restaurantId + " start=" + startDate + " end=" + endDate);

        java.time.Instant start = null;
        java.time.Instant end = null;

        if (startDate != null && !startDate.isBlank()) start = java.time.Instant.parse(startDate);
        if (endDate != null && !endDate.isBlank()) end = java.time.Instant.parse(endDate);

        if (start == null && end == null) {
            // Default: Today in requested timezone
            java.time.LocalDate today = java.time.LocalDate.now(zone);
            start = today.atStartOfDay(zone).toInstant();
            end = today.plusDays(1).atStartOfDay(zone).toInstant().minusMillis(1);
        } else {
             if (end == null) end = java.time.Instant.now();
             if (start == null) start = end.minus(1, java.time.temporal.ChronoUnit.DAYS);
        }

        var dto = statsService.getStats(restaurantId, start, end);
        return ResponseEntity.ok(Map.of(
                "ordersToday", dto.ordersToday(),
                "revenueToday", dto.revenueToday(),
                "activeTables", dto.activeTables(),
                "availableTables", dto.availableTables(),
                "activeOrders", dto.activeOrders()
        ));
    }
}
