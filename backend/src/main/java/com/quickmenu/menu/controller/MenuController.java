package com.quickmenu.menu.controller;

import com.quickmenu.menu.dto.MenuDto;
import com.quickmenu.menu.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{restaurantId}/menu")
@Tag(name = "Menu", description = "Menu details of a restaurant")
public class MenuController {

    private final MenuService menuService;
    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    @Operation(summary = "Menu)", description = "Returns menu.")
    public MenuDto getMenu(@PathVariable String restaurantId,
                           @RequestParam(defaultValue = "false") boolean includeUnavailable) {
        return menuService.getMenu(restaurantId, includeUnavailable);
    }
}
