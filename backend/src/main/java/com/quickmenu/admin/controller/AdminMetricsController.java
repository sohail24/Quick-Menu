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
    @Operation(summary = "Admin metrics - top dishes & hourly breakdown (last 24 hours)", description = "Returns top 5 dishes & hourly breakdown.")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getMetrics(@RequestParam String restaurantId,
                                        @RequestParam(required = false) String timezone) {
        ZoneId zone = timezone == null ? ZoneId.of("UTC") : ZoneId.of(timezone);
        AdminMetricsResponse resp = metricsService.getMetrics(restaurantId, zone);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/stats")
    @Operation(summary = "Admin stats", description = "Simple stats (orders count and revenue for today).")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getStats(@RequestParam String restaurantId,
                                      @RequestParam(required = false) String timezone) {
        ZoneId zone = timezone == null ? ZoneId.of("UTC") : ZoneId.of(timezone);
        var dto = statsService.getTodayStats(restaurantId, zone);
        return ResponseEntity.ok(Map.of(
                "ordersToday", dto.ordersToday(),
                "revenueToday", dto.revenueToday()
        ));
    }
}
