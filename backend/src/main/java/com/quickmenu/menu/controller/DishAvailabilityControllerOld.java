package com.quickmenu.menu.controller;

import com.quickmenu.menu.repo.DishRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{restaurantId}/dishes")
public class DishAvailabilityControllerOld {

    private final DishRepository dishRepository;

    public DishAvailabilityControllerOld(DishRepository dishRepository) {
        this.dishRepository = dishRepository;
    }

//    /**
//     * PATCH /api/{restaurantId}/dishes/{dishId}/availability
//     * Body: { "isAvailable": true }
//     */
//    @PatchMapping("/{dishId}/availability")
//    @Operation(summary = "Toggle availability", description = "Toggle dish availability (mark in/out-of-stock).")
//    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
//    public ResponseEntity<?> toggleAvailability(@PathVariable String restaurantId,
//                                                @PathVariable String dishId,
//                                                @RequestBody Map<String, Boolean> body) {
//        Boolean isAvailable = body.get("isAvailable");
//        if (isAvailable == null) {
//            return ResponseEntity.badRequest().body(Map.of("error", "isAvailable is required"));
//        }
//
//        Dish dish = dishRepository.findById(dishId)
//                .filter(d -> restaurantId.equals(d.getRestaurantId()))
//                .orElseThrow(() -> new IllegalArgumentException("Dish not found"));
//
//        dish.setIsAvailable(isAvailable);
//        dishRepository.save(dish);
//        return ResponseEntity.ok(Map.of("dishId", dish.getId(), "isAvailable", dish.getIsAvailable()));
//    }
}
