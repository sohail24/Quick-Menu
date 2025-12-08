package com.quickmenu.menu.mapper;


import com.quickmenu.menu.dto.MenuDto;
import com.quickmenu.menu.model.Dish;

public class DishMapper {
    public static MenuDto.DishDto toResponse(Dish dish) {
        MenuDto.DishDto dto = new MenuDto.DishDto();
        dto.setId(dish.getId());
        dto.setCategoryId(dish.getCategoryId());
        dto.setName(dish.getName());
        dto.setDescription(dish.getDescription());
        dto.setIsAvailable(dish.getIsAvailable());
        dto.setImageUrl(dish.getImageUrl());
        dto.setPrice(dish.getPrice());
        dto.setPrepTimeMins(dish.getPrepTimeMins());
        return dto;
    }
}
