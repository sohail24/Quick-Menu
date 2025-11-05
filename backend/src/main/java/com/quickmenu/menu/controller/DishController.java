package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.menu.service.MenuService;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{restaurantId}/dishes")
public class DishController {

    private final DishRepository dishRepository;
    private final MenuService menuService;

    public DishController(DishRepository dishRepository, MenuService menuService) {
        this.dishRepository = dishRepository;
        this.menuService = menuService;
    }

    @PostMapping
    public ResponseEntity<Dish> createDish(@PathVariable String restaurantId, @RequestBody Dish req) {
        req.setRestaurantId(restaurantId);
        Dish created = menuService.createDish(req);
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
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

    @PatchMapping("/{dishId}")
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
                    return ResponseEntity.ok(dishRepository.save(existing));
                }).orElseGet(() -> ResponseEntity.notFound().build());
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
