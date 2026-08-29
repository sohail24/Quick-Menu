package com.quickmenu.bell.controller;

import com.quickmenu.bell.service.BellDomainService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables/{tableId}/bell")
public class BellController {

    private final BellDomainService bellDomainService;

    public BellController(BellDomainService bellDomainService) {
        this.bellDomainService = bellDomainService;
    }

    @PostMapping
    public ResponseEntity<?> ringBell(@PathVariable String restaurantId,
                                      @PathVariable String tableId) {
        try {
            Map<String, Object> response = bellDomainService.ringBell(restaurantId, tableId);
            return ResponseEntity.ok(response);
        } catch (BellDomainService.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
