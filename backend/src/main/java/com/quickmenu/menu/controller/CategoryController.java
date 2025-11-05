package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.Category;
import com.quickmenu.menu.repo.CategoryRepository;
import com.quickmenu.menu.service.MenuService;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{restaurantId}/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final MenuService menuService;

    public CategoryController(CategoryRepository categoryRepository, MenuService menuService) {
        this.categoryRepository = categoryRepository;
        this.menuService = menuService;
    }

    @PostMapping
    public ResponseEntity<Category> create(@PathVariable String restaurantId, @RequestBody Category req) {
        Category created = menuService.createCategory(restaurantId, req.getName(), req.getOrderIndex());
        return ResponseEntity.status(201).body(created);
    }

    @GetMapping
    public ResponseEntity<Page<Category>> listCategories(@PathVariable String restaurantId,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size,
                                                         @RequestParam(defaultValue = "orderIndex") String[] sort) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(parseSort(sort)));
        Page<Category> p = categoryRepository.findByRestaurantId(restaurantId, pageable);
        return ResponseEntity.ok(p);
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
