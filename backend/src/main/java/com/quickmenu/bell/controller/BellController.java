package com.quickmenu.bell.controller;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.service.BellService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
@Tag(name = "Bell", description = "Customer 'Ring the Bell' feature to notify staff")
public class BellController {

    private final BellService bellService;

    public BellController(BellService bellService) {
        this.bellService = bellService;
    }

    /**
     * POST /api/restaurants/{restaurantId}/tables/{tableId}/bell
     * Body: { "message": "Please send water" } (optional)
     *
     * Public endpoint (no auth) so customers can ring bell via QR.
     * Rate-limited by BellService.
     */
    @PostMapping("/{tableId}/bell")
    @Operation(summary = "Ring the bell", description = "Customer rings bell (public endpoint). Rate-limited to prevent spam.")
    public ResponseEntity<?> ringBell(@PathVariable String restaurantId,
                                      @PathVariable String tableId,
                                      @RequestBody(required = false) Map<String, String> payload) {
        String message = payload == null ? null : payload.get("message");
        try {
            BellEvent event = bellService.createBell(restaurantId, tableId, message, "QR");
            return ResponseEntity.created(URI.create("/api/restaurants/" + restaurantId + "/bells/" + event.getId()))
                    .body(Map.of(
                            "id", event.getId(),
                            "timestamp", event.getCreatedAt().toString(),
                            "success", true
                    ));
        } catch (IllegalStateException ex) {
            // rate limit
            return ResponseEntity.status(429).body(Map.of("error", "Too many requests", "message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bad request", "message", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
}
