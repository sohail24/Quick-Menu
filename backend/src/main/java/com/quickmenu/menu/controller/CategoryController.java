package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.Category;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.CategoryRepository;
import com.quickmenu.menu.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{restaurantId}/categories")
@Tag(name = "Menu", description = "Categories for restaurant menus")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final MenuService menuService;

    public CategoryController(CategoryRepository categoryRepository, MenuService menuService) {
        this.categoryRepository = categoryRepository;
        this.menuService = menuService;
    }

    @PostMapping
    @Operation(summary = "Create category", description = "Create a category under the restaurant (admin/staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Category> create(@PathVariable String restaurantId, @RequestBody Category req) {
        Category created = menuService.createCategory(restaurantId, req.getName(), req.getOrderIndex());
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    @Operation(summary = "List categories", description = "List categories (paginated).")
    public ResponseEntity<Page<Category>> listCategories(@PathVariable String restaurantId,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size,
                                                         @RequestParam(defaultValue = "orderIndex") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        Page<Category> p = categoryRepository.findByRestaurantId(restaurantId, pageable);
        return ResponseEntity.ok(p);
    }

    @PatchMapping("/{categoryId}")
    @Operation(summary = "Update dish", description = "Partially update category property properties (admin/staff).")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<Category> updateDish(@PathVariable String restaurantId,
                                           @PathVariable String categoryId,
                                           @RequestBody Category req) {
        return categoryRepository.findById(categoryId)
                .filter(c -> restaurantId.equals(c.getRestaurantId()))
                .map(existing -> {
                            if (req.getName() != null) existing.setName(req.getName());
                            if (req.getOrderIndex() != null) existing.setOrderIndex(req.getOrderIndex());
                            return ResponseEntity.ok(categoryRepository.save(existing));
                        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
                    // helper
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
