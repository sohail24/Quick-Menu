package com.quickmenu.admin;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {

    private final AdminStatsService statsService;

    public AdminStatsController(AdminStatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')") // restrict if desired
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
