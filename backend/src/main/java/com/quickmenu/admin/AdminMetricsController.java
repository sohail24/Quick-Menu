package com.quickmenu.admin;

import com.quickmenu.admin.dto.MetricDtos.AdminMetricsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin metrics in the system")
public class AdminMetricsController {

    private final AdminMetricsService metricsService;

    public AdminMetricsController(AdminMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/metrics")
    @Operation(summary = "Admin metrics - top dishes & hourly breakdown (last 24 hours)", description = "Returns top 5 dishes & hourly breakdown")
    @PreAuthorize("hasRole('ADMIN')") // protect in prod
    public ResponseEntity<?> getMetrics(@RequestParam String restaurantId,
                                        @RequestParam(required = false) String timezone) {
        ZoneId zone = timezone == null ? ZoneId.of("UTC") : ZoneId.of(timezone);
        AdminMetricsResponse resp = metricsService.getMetrics(restaurantId, zone);
        return ResponseEntity.ok(resp);
    }
}
