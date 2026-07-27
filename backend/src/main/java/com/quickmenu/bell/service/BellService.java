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

    // In-memory record for exponential backoff; key = restaurantId:tableId
    private final Map<String, BellUsage> usageRecords = new ConcurrentHashMap<>();

    private final long initialCooldown;
    private final long maxCooldown;
    private final long resetWindowMinutes;

    public BellService(BellEventRepository bellRepo,
                       SimpMessagingTemplate messagingTemplate,
                       TableService tableService,
                       @Value("${app.bell.cooldown-seconds:20}") long initialCooldown,
                       @Value("${app.bell.max-cooldown-seconds:600}") long maxCooldown,
                       @Value("${app.bell.reset-window-minutes:5}") long resetWindowMinutes) {
        this.bellRepo = bellRepo;
        this.messagingTemplate = messagingTemplate;
        this.tableService = tableService;
        this.initialCooldown = initialCooldown;
        this.maxCooldown = maxCooldown;
        this.resetWindowMinutes = resetWindowMinutes;
    }

    /**
     * Create a bell event if not rate-limited by exponential backoff.
     */
    public BellEvent createBell(String restaurantId, String tableId, String message, String source) {
        tableService.getTable(restaurantId, tableId);

        String key = restaurantId + ":" + tableId;
        Instant now = Instant.now();

        // Atomic update of usage record
        BellUsage usage = usageRecords.compute(key, (k, v) -> {
            if (v == null || now.isAfter(v.lastRingAt.plus(java.time.Duration.ofMinutes(resetWindowMinutes)))) {
                return new BellUsage(now, 0); // Reset after inactivity or new entry
            }
            return v;
        });

        long currentCooldown = calculateCooldown(usage.count);
        if (usage.count > 0 && now.isBefore(usage.lastRingAt.plusSeconds(currentCooldown))) {
            long waitTime = (usage.lastRingAt.plusSeconds(currentCooldown).getEpochSecond()) - now.getEpochSecond();
            throw new IllegalStateException("Please wait " + waitTime + " seconds before ringing again.");
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

        // Update usage after successful persisting
        usage.lastRingAt = now;
        usage.count++;

        // publish to WebSocket
        try {
            var payload = Map.of(
                    "id", saved.getId(),
                    "tableId", saved.getTableId(),
                    "tableName", saved.getTableName() != null ? saved.getTableName() : "",
                    "message", saved.getMessage(),
                    "createdAt", saved.getCreatedAt().toString(),
                    "type", "BELL_CREATED"
            );
            messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/bells", payload);
            saved.setDelivered(true);
            saved.setAttempts(saved.getAttempts() == null ? 1 : saved.getAttempts() + 1);
            bellRepo.save(saved);
        } catch (Exception ex) {
            saved.setAttempts(saved.getAttempts() == null ? 1 : saved.getAttempts() + 1);
            bellRepo.save(saved);
        }

        return saved;
    }

    private long calculateCooldown(int count) {
        if (count <= 0) return 0;
        // 20, 40, 80, 160...
        long cooldown = initialCooldown * (long) Math.pow(2, count - 1);
        return Math.min(cooldown, maxCooldown);
    }

    private static class BellUsage {
        Instant lastRingAt;
        int count;

        BellUsage(Instant lastRingAt, int count) {
            this.lastRingAt = lastRingAt;
            this.count = count;
        }
    }

    public BellEvent ackBell(String restaurantId, String bellId, String ackBy) {
        BellEvent e = bellRepo.findById(bellId)
                .filter(ev -> Objects.equals(ev.getRestaurantId(), restaurantId))
                .orElseThrow(() -> new IllegalArgumentException("Bell event not found"));

        e.setStatus(Status.ACKED);
        e.setAckBy(ackBy);
        e.setAckAt(Instant.now());
        BellEvent updated = bellRepo.save(e);

        var payload = Map.of(
                "id", updated.getId(),
                "tableId", updated.getTableId(),
                "tableName", updated.getTableName() != null ? updated.getTableName() : "",
                "type", "BELL_ACKED",
                "ackBy", updated.getAckBy(),
                "ackAt", updated.getAckAt().toString()
        );
        messagingTemplate.convertAndSend("/topic/restaurants/" + restaurantId + "/bells", payload);

        return updated;
    }
}

