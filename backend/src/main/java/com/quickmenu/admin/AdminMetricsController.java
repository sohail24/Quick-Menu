package com.quickmenu.admin;

import com.quickmenu.admin.dto.MetricDtos.AdminMetricsResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;

@RestController
@RequestMapping("/api/admin")
public class AdminMetricsController {

    private final AdminMetricsService metricsService;

    public AdminMetricsController(AdminMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/metrics")
    // @PreAuthorize("hasRole('ADMIN')") // protect in prod
    public ResponseEntity<?> getMetrics(@RequestParam String restaurantId,
                                        @RequestParam(required = false) String timezone) {
        ZoneId zone = timezone == null ? ZoneId.of("UTC") : ZoneId.of(timezone);
        AdminMetricsResponse resp = metricsService.getMetrics(restaurantId, zone);
        return ResponseEntity.ok(resp);
    }
}
