package com.quickmenu.menu.controller;

import com.quickmenu.dto.MenuDto;
import com.quickmenu.menu.service.MenuService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/{restaurantId}/menu")
public class MenuController {

    private final MenuService menuService;
    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public MenuDto getMenu(@PathVariable String restaurantId,
                           @RequestParam(defaultValue = "false") boolean includeUnavailable) {
        return menuService.getMenu(restaurantId, includeUnavailable);
    }
}
