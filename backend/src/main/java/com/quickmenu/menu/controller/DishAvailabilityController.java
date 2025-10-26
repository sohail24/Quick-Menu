package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.DishRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/{restaurantId}/dishes")
public class DishAvailabilityController {

    private final DishRepository dishRepository;

    public DishAvailabilityController(DishRepository dishRepository) {
        this.dishRepository = dishRepository;
    }

    /**
     * PATCH /api/{restaurantId}/dishes/{dishId}/availability
     * Body: { "isAvailable": true }
     */
    @PatchMapping("/{dishId}/availability")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> toggleAvailability(@PathVariable String restaurantId,
                                                @PathVariable String dishId,
                                                @RequestBody Map<String, Boolean> body) {
        Boolean isAvailable = body.get("isAvailable");
        if (isAvailable == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "isAvailable is required"));
        }

        Dish dish = dishRepository.findById(dishId)
                .filter(d -> restaurantId.equals(d.getRestaurantId()))
                .orElseThrow(() -> new IllegalArgumentException("Dish not found"));

        dish.setIsAvailable(isAvailable);
        dishRepository.save(dish);
        return ResponseEntity.ok(Map.of("dishId", dish.getId(), "isAvailable", dish.getIsAvailable()));
    }
}
