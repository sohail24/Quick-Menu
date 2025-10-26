package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Dish;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DishRepository extends JpaRepository<Dish, String> {
    List<Dish> findByRestaurantIdAndIsAvailableTrue(String restaurantId);
    List<Dish> findByRestaurantId(String restaurantId);
}
