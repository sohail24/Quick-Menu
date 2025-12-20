package com.quickmenu.menu.controller;

import com.quickmenu.menu.dto.MenuDto;
import com.quickmenu.menu.mapper.DishMapper;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.menu.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/{restaurantId}/dishes")
@Tag(name = "Menu", description = "Dishes and menu item operations")
public class DishController {

    private final DishRepository dishRepository;
    private final MenuService menuService;

    public DishController(DishRepository dishRepository, MenuService menuService) {
        this.dishRepository = dishRepository;
        this.menuService = menuService;
    }

    @PostMapping
    @Operation(summary = "Create dish", description = "Create a dish (admin/staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Dish> createDish(@PathVariable String restaurantId, @RequestBody Dish req) {
        req.setRestaurantId(restaurantId);
        Dish created = menuService.createDish(req);
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    @Operation(summary = "List dishes", description = "List dishes for a restaurant (supports includeUnavailable & pagination).")
    public ResponseEntity<Page<Dish>> listDishes(@PathVariable String restaurantId,
                                                 @RequestParam(defaultValue = "false") boolean includeUnavailable,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size,
                                                 @RequestParam(defaultValue = "name") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));

        Page<Dish> p = includeUnavailable
                ? dishRepository.findByRestaurantId(restaurantId, pageable)
                : dishRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId, pageable);

        return ResponseEntity.ok(p);
    }

    @GetMapping("/{dishId}")
    @Operation(summary = "Get dish", description = "Get the details of the dish based on the dish id and restaurant id")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<MenuDto.DishDto> getDish(@PathVariable String restaurantId,
                                                   @PathVariable String dishId) {
        return dishRepository.findById(dishId)
                .filter(d -> restaurantId.equals(d.getRestaurantId()))
                .map(dish -> ResponseEntity.ok(DishMapper.toResponse(dish)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{dishId}")
    @Operation(summary = "Update dish", description = "Partially update dish properties (admin/staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Dish> updateDish(@PathVariable String restaurantId,
                                           @PathVariable String dishId,
                                           @RequestBody Dish req) {
        return dishRepository.findById(dishId)
                .filter(d -> restaurantId.equals(d.getRestaurantId()))
                .map(existing -> {
                    if (req.getName() != null) existing.setName(req.getName());
                    if (req.getDescription() != null) existing.setDescription(req.getDescription());
                    if (req.getPrice() != null) existing.setPrice(req.getPrice());
                    if (req.getImageUrl() != null) existing.setImageUrl(req.getImageUrl());
                    if (req.getIsAvailable() != null) existing.setIsAvailable(req.getIsAvailable());
                    if (req.getCategoryId() != null) existing.setCategoryId(req.getCategoryId());
                    return ResponseEntity.ok(dishRepository.save(existing));
                }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * PATCH /api/{restaurantId}/dishes/{dishId}/availability
     * Body: { "isAvailable": true }
     */
    @PatchMapping("/{dishId}/availability")
    @Operation(summary = "Toggle availability", description = "Toggle dish availability (mark in/out-of-stock).")
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

    @DeleteMapping("/{dishId}")
    @Operation(summary = "Delete dish", description = "Delete a dish under the restaurant (admin/staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> deleteDish(@PathVariable String restaurantId,
                                           @PathVariable String dishId) {
        return dishRepository.findById(dishId)
                .filter(d -> restaurantId.equals(d.getRestaurantId()))
                .map(existing -> {
                    dishRepository.delete(existing);
                    return ResponseEntity.noContent().build(); // 204 No Content
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Sort.Order[] parseSort(String[] sort) {
        return java.util.Arrays.stream(sort)
                .map(s -> {
                    String[] parts = s.split(",");
                    String prop = parts[0].trim();
                    Sort.Direction dir = parts.length > 1 ? Sort.Direction.fromString(parts[1].trim()) : Sort.Direction.ASC;
                    return new Sort.Order(dir, prop);
                }).toArray(Sort.Order[]::new);
    }
}
