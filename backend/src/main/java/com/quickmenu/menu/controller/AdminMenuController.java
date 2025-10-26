package com.quickmenu.menu.controller;

import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.model.Category;
import com.quickmenu.menu.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{restaurantId}")
public class AdminMenuController {

    private final MenuService menuService;

    public AdminMenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@PathVariable String restaurantId,
                                                   @RequestBody Category req) {
        Category created = menuService.createCategory(restaurantId, req.getName(), req.getOrderIndex());
        return ResponseEntity.status(201).body(created);
    }

    @PostMapping("/dishes")
    public ResponseEntity<Dish> createDish(@PathVariable String restaurantId,
                                           @RequestBody Dish req) {
        // ensure restaurantId set from path
        req.setRestaurantId(restaurantId);
        Dish created = menuService.createDish(req);
        return ResponseEntity.status(201).body(created);
    }
}
