package com.quickmenu.bell.controller;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.repo.BellEventRepository;
import com.quickmenu.bell.service.BellService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/{restaurantId}/bells")
@Tag(name = "Bell Admin", description = "Staff endpoints for bell events (list & acknowledge)")
public class BellAdminController {

    private final BellEventRepository bellEventRepository;
    private final BellService bellService;

    public BellAdminController(BellEventRepository bellEventRepository, BellService bellService) {
        this.bellEventRepository = bellEventRepository;
        this.bellService = bellService;
    }

    /**
     * GET /api/{restaurantId}/bells
     * List bell events (paged). Staff-only.
     */
    @GetMapping
    @Operation(summary = "List bell events", description = "List recent bell events (paginated), filter by status.")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Page<BellEvent>> list(@PathVariable String restaurantId,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size,
                                                @RequestParam(required = false) BellEvent.Status status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BellEvent> p = (status == null) ?
                bellEventRepository.findByRestaurantId(restaurantId, pageable) :
                bellEventRepository.findByRestaurantIdAndStatus(restaurantId, status, pageable);
        return ResponseEntity.ok(p);
    }

    /**
     * PATCH /api/{restaurantId}/bells/{bellId}/ack
     * Mark bell as acknowledged by staff.
     *
     * Extracts authenticated user id/name from SecurityContext.
     */
    @PatchMapping("/{bellId}/ack")
    @Operation(summary = "Acknowledge bell", description = "Staff acknowledges a bell event. The authenticated user is recorded as the ackBy.")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> ack(@PathVariable String restaurantId,
                                 @PathVariable String bellId) {
        try {
            String ackBy = extractUserIdFromSecurityContext().orElse("staff");

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
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }

    /**
     * Helper: try to extract a meaningful user identifier from the Spring Security context.
     * Supports common principal shapes (UserDetails, Principal, Jwt principal).
     */
    private Optional<String> extractUserIdFromSecurityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        try {
            // If using UserDetails (common in basic UserDetailsService)
            if (principal instanceof UserDetails) {
                return Optional.ofNullable(((UserDetails) principal).getUsername());
            }

            // If principal is java.security.Principal
            if (principal instanceof java.security.Principal) {
                return Optional.ofNullable(((java.security.Principal) principal).getName());
            }

//            // If using Jwt as principal (spring security resource server)
//            if (principal instanceof org.springframework.security.oauth2.jwt.Jwt) {
//                org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) principal;
//                // Prefer "sub" then "preferred_username" then "email" (customize if you use different claim)
//                String sub = jwt.getClaimAsString("sub");
//                if (sub != null && !sub.isBlank()) return Optional.of(sub);
//                String pref = jwt.getClaimAsString("preferred_username");
//                if (pref != null && !pref.isBlank()) return Optional.of(pref);
//                String email = jwt.getClaimAsString("email");
//                if (email != null && !email.isBlank()) return Optional.of(email);
//            }

            // Fallback to Authentication.getName()
            String name = authentication.getName();
            if (name != null && !name.isBlank()) return Optional.of(name);
        } catch (Exception e) {
            // swallow and return empty optional
        }

        // final fallback: principal.toString()
        if (principal != null) {
            return Optional.of(principal.toString());
        }

        return Optional.empty();
    }
}
