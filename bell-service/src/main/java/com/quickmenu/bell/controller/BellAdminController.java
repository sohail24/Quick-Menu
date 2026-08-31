package com.quickmenu.bell.controller;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.repo.BellEventRepository;
import com.quickmenu.bell.service.BellService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/{restaurantId}/bells")
public class BellAdminController {

    private final BellEventRepository bellEventRepository;
    private final BellService bellService;

    public BellAdminController(BellEventRepository bellEventRepository, BellService bellService) {
        this.bellEventRepository = bellEventRepository;
        this.bellService = bellService;
    }

    /**
     * GET /api/{restaurantId}/bells
     * Staff/Admin list of bell events, paged and optionally filtered by status.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_STAFF')")
    public ResponseEntity<Page<BellEvent>> list(@PathVariable String restaurantId,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size,
                                                @RequestParam(required = false) BellEvent.Status status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BellEvent> p = (status == null)
                ? bellEventRepository.findByRestaurantId(restaurantId, pageable)
                : bellEventRepository.findByRestaurantIdAndStatus(restaurantId, status, pageable);
        return ResponseEntity.ok(p);
    }

    /**
     * PATCH /api/{restaurantId}/bells/{bellId}/ack
     * Staff acknowledges a bell — marks ACKED, records who acked and when.
     */
    @PatchMapping("/{bellId}/ack")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_STAFF')")
    public ResponseEntity<?> ack(@PathVariable String restaurantId,
                                 @PathVariable String bellId) {
        try {
            String ackBy = extractPrincipal().orElse("staff");
            BellEvent updated = bellService.ackBell(restaurantId, bellId, ackBy);
            return ResponseEntity.ok(Map.of(
                    "id", updated.getId(),
                    "status", updated.getStatus(),
                    "ackBy", updated.getAckBy(),
                    "ackAt", Optional.ofNullable(updated.getAckAt()).map(Object::toString).orElse(null)
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }

    private Optional<String> extractPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();
        String name = auth.getName();
        return (name != null && !name.isBlank()) ? Optional.of(name) : Optional.empty();
    }
}
