package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.Restaurant;
import com.quickmenu.menu.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    // You can add: @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Restaurant> create(@RequestBody Restaurant req) {
        Restaurant created = restaurantService.create(req);
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Restaurant>> listAll() {
        return ResponseEntity.ok(restaurantService.listAll());
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<Restaurant> getOne(@PathVariable String restaurantId) {
        return ResponseEntity.ok(restaurantService.getById(restaurantId));
    }

    @PatchMapping("/{restaurantId}")
    // You can add: @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Restaurant> update(@PathVariable String restaurantId, @RequestBody Restaurant req) {
        return ResponseEntity.ok(restaurantService.update(restaurantId, req));
    }

    @DeleteMapping("/{restaurantId}")
    // You can add: @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable String restaurantId) {
        restaurantService.delete(restaurantId);
        return ResponseEntity.noContent().build();
    }
}
