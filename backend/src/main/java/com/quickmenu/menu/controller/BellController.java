package com.quickmenu.menu.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/{restaurantId}/tables")
public class BellController {

    private final SimpMessagingTemplate messagingTemplate;
    public BellController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/{tableId}/bell")
    public ResponseEntity<?> ringBell(@PathVariable String restaurantId,
                                      @PathVariable String tableId,
                                      @RequestBody(required = false) Map<String, String> payload) {
        String message = payload == null ? "Customer called" : payload.getOrDefault("message", "Customer called");
        var event = Map.of(
                "tableId", tableId,
                "message", message,
                "timestamp", Instant.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/bells", event);
        return ResponseEntity.ok(Map.of("success", true, "timestamp", Instant.now().toString()));
    }
}
