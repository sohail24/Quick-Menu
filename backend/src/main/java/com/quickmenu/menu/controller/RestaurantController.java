package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.Restaurant;
import com.quickmenu.menu.repo.RestaurantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/restaurants")
@Tag(name = "Restaurants", description = "Restaurant onboarding, details and listing")
public class RestaurantController {

    private final RestaurantRepository restaurantRepository;

    public RestaurantController(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @PostMapping
    @Operation(summary = "Create restaurant", description = "Create a new restaurant (admin).")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Restaurant> create(@RequestBody Restaurant req) {
        Restaurant created = restaurantRepository.save(req);
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    @Operation(summary = "List restaurants", description = "List restaurants (paginated).")
    public ResponseEntity<Page<Restaurant>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String[] sort) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        Page<Restaurant> p = restaurantRepository.findAll(pageable);
        return ResponseEntity.ok(p);
    }

    @GetMapping("/owner/{ownerUserId}")
    @Operation(summary = "List restaurants by ownerId", description = "List restaurants by ownerId (paginated).")
    public ResponseEntity<Page<Restaurant>> listAllByOwnerId(
            @PathVariable String ownerUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String[] sort) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        Page<Restaurant> p = restaurantRepository.findAllByOwnerUserId(ownerUserId ,pageable);
        return ResponseEntity.ok(p);
    }

    @GetMapping("/{restaurantId}")
    @Operation(summary = "Get restaurant details", description = "Get details for a restaurant by id.")
    public ResponseEntity<Restaurant> getOne(@PathVariable String restaurantId) {
        return restaurantRepository.findById(restaurantId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{restaurantId}")
    @Operation(summary = "Update restaurant", description = "Partially update restaurant metadata (admin).")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Restaurant> update(@PathVariable String restaurantId, @RequestBody Restaurant req) {
        return restaurantRepository.findById(restaurantId)
                .map(existing -> {
                    existing.setName(req.getName() != null ? req.getName() : existing.getName());
                    existing.setTimezone(req.getTimezone() != null ? req.getTimezone() : existing.getTimezone());
                    existing.setCurrency(req.getCurrency() != null ? req.getCurrency() : existing.getCurrency());
                    existing.setAddress(req.getAddress() != null ? req.getAddress() : existing.getAddress());
                    existing.setDescription(req.getDescription() != null ? req.getDescription() : existing.getDescription());
                    existing.setBannerUrl(req.getBannerUrl() != null ? req.getBannerUrl() : existing.getBannerUrl());
                    //existing.setOwnerUserId(req.getOwnerUserId() != null ? req.getOwnerUserId() : existing.getOwnerUserId()); // owner userid and plan can only be changed from backend for security
                    return ResponseEntity.ok(restaurantRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{restaurantId}")
    @Operation(summary = "Delete restaurant", description = "Delete a restaurant (admin).")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable String restaurantId) {
        restaurantRepository.deleteById(restaurantId);
        return ResponseEntity.noContent().build();
    }

    // helper to parse sort param(s)
    private Sort.Order[] parseSort(String[] sort) {
        return Arrays.stream(sort)
                .map(s -> {
                    String[] parts = s.split(",");
                    String prop = parts[0].trim();
                    Sort.Direction dir = parts.length > 1 ? Sort.Direction.fromString(parts[1].trim()) : Sort.Direction.ASC;
                    return new Sort.Order(dir, prop);
                })
                .toArray(Sort.Order[]::new);
    }
}
