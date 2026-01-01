package com.quickmenu.bell.service;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.model.BellEvent.Status;
import com.quickmenu.bell.repo.BellEventRepository;
import com.quickmenu.menu.service.TableService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BellService {

    private final BellEventRepository bellRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final TableService tableService;

    // Simple in-memory map for cooldown; key = restaurantId:tableId -> last event epoch second
    private final Map<String, Instant> lastEventAt = new ConcurrentHashMap<>();

    // cooldown seconds configurable via app.properties (default 20s)
    private final long cooldownSeconds;

    public BellService(BellEventRepository bellRepo,
                       SimpMessagingTemplate messagingTemplate,
                       TableService tableService,
                       @Value("${app.bell.cooldown-seconds:20}") long cooldownSeconds) {
        this.bellRepo = bellRepo;
        this.messagingTemplate = messagingTemplate;
        this.tableService = tableService;
        this.cooldownSeconds = cooldownSeconds;
    }

    /**
     * Create a bell event if not rate-limited.
     * Returns the persisted BellEvent.
     * Throws IllegalStateException if rate-limited.
     */
    public BellEvent createBell(String restaurantId, String tableId, String message, String source) {
        // Basic validation: ensure table exists and belongs to restaurant
        // TableService throws if not found
        tableService.getTable(restaurantId, tableId);

        String key = restaurantId + ":" + tableId;
        Instant now = Instant.now();
        Instant last = lastEventAt.get(key);
        if (last != null && now.isBefore(last.plusSeconds(cooldownSeconds))) {
            throw new IllegalStateException("Too many bell requests. Please wait a moment before ringing again.");
        }

        // persist
        BellEvent event = BellEvent.builder()
                .restaurantId(restaurantId)
                .tableId(tableId)
                .message(message)
                .source(source == null ? "QR" : source)
                .status(Status.PENDING)
                .createdAt(now)
                .delivered(false)
                .attempts(0)
                .build();

        BellEvent saved = bellRepo.save(event);

        // update last seen timestamp for cooldown
        lastEventAt.put(key, now);

        // publish to WebSocket topic for staff dashboards
        try {
            // payload to send; you can design the payload as needed by frontend
            var payload = Map.of(
                    "id", saved.getId(),
                    "tableId", saved.getTableId(),
                    "message", saved.getMessage(),
                    "createdAt", saved.getCreatedAt().toString(),
                    "type", "BELL_CREATED"
            );
            messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/bells", payload);
            // mark delivered true and increment attempts
            saved.setDelivered(true);
            saved.setAttempts(saved.getAttempts() == null ? 1 : saved.getAttempts() + 1);
            bellRepo.save(saved);
        } catch (Exception ex) {
            // If publish fails, leave delivered=false; attempts incremented optionally
            saved.setAttempts(saved.getAttempts() == null ? 1 : saved.getAttempts() + 1);
            bellRepo.save(saved);
        }

        return saved;
    }

    public BellEvent ackBell(String restaurantId, String bellId, String ackBy) {
        BellEvent e = bellRepo.findById(bellId)
                .filter(ev -> Objects.equals(ev.getRestaurantId(), restaurantId))
                .orElseThrow(() -> new IllegalArgumentException("Bell event not found"));

        e.setStatus(Status.ACKED);
        e.setAckBy(ackBy);
        e.setAckAt(Instant.now());
        BellEvent updated = bellRepo.save(e);

        // broadcast ack to UI (so other staff/customer UIs can update)
        var payload = Map.of(
                "id", updated.getId(),
                "tableId", updated.getTableId(),
                "type", "BELL_ACKED",
                "ackBy", updated.getAckBy(),
                "ackAt", updated.getAckAt().toString()
        );
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/bells", payload);

        return updated;
    }
}
