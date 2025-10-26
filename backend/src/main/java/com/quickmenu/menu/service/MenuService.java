package com.quickmenu.menu.service;

import com.quickmenu.dto.MenuDto;
import com.quickmenu.menu.model.Category;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.repo.CategoryRepository;
import com.quickmenu.menu.repo.DishRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MenuService {

    private final CategoryRepository categoryRepository;
    private final DishRepository dishRepository;

    public MenuService(CategoryRepository categoryRepository, DishRepository dishRepository) {
        this.categoryRepository = categoryRepository;
        this.dishRepository = dishRepository;
    }

    public MenuDto getMenu(String restaurantId, boolean includeUnavailable) {
        List<Category> categories = categoryRepository.findByRestaurantIdOrderByOrderIndex(restaurantId);
        List<Dish> dishes = includeUnavailable ? dishRepository.findByRestaurantId(restaurantId)
                : dishRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId);

        MenuDto dto = new MenuDto();
        dto.setCategories(categories.stream().map(c -> {
            MenuDto.CategoryDto cd = new MenuDto.CategoryDto();
            cd.setId(c.getId());
            cd.setName(c.getName());
            cd.setOrderIndex(c.getOrderIndex());
            return cd;
        }).collect(Collectors.toList()));

        dto.setDishes(dishes.stream().map(d -> {
            MenuDto.DishDto dd = new MenuDto.DishDto();
            dd.setId(d.getId());
            dd.setCategoryId(d.getCategoryId());
            dd.setName(d.getName());
            dd.setDescription(d.getDescription());
            dd.setPrice(d.getPrice());
            dd.setImageUrl(d.getImageUrl());
            dd.setIsAvailable(d.getIsAvailable());
            dd.setPrepTimeMins(d.getPrepTimeMins());
            return dd;
        }).collect(Collectors.toList()));
        return dto;
    }

    public Category createCategory(String restaurantId, String name, Integer orderIndex) {
        Category c = Category.builder()
                .restaurantId(restaurantId)
                .name(name)
                .orderIndex(orderIndex)
                .build();
        return categoryRepository.save(c);
    }

    public Dish createDish(Dish dish) {
        return dishRepository.save(dish);
    }
}
