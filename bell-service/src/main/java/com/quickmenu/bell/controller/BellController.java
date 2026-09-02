package com.quickmenu.bell.controller;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.service.BellService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
public class BellController {

    private final BellService bellService;

    public BellController(BellService bellService) {
        this.bellService = bellService;
    }

    /**
     * POST /api/restaurants/{restaurantId}/tables/{tableId}/bell
     * Public endpoint — customers ring the bell via QR code. No JWT required.
     * Rate-limited by Redis TTL cooldown in BellService.
     */
    @PostMapping("/{tableId}/bell")
    public ResponseEntity<?> ringBell(@PathVariable String restaurantId,
                                      @PathVariable String tableId,
                                      @RequestBody(required = false) Map<String, String> payload) {
        String message = payload == null ? null : payload.get("message");
        try {
            BellEvent event = bellService.createBell(restaurantId, tableId, message, "QR");
            return ResponseEntity
                    .created(URI.create("/api/restaurants/" + restaurantId + "/bells/" + event.getId()))
                    .body(Map.of(
                            "id", event.getId(),
                            "timestamp", event.getCreatedAt().toString(),
                            "success", true
                    ));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Too many requests",
                    "message", ex.getMessage()
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
}
