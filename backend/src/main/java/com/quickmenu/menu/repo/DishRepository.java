package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Dish;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DishRepository extends JpaRepository<Dish, String> {
    List<Dish> findByRestaurantIdAndIsAvailableTrue(String restaurantId);
    List<Dish> findByRestaurantId(String restaurantId);

    // Pageable variants
    Page<Dish> findByRestaurantId(String restaurantId, Pageable pageable);
    Page<Dish> findByRestaurantIdAndIsAvailableTrue(String restaurantId, Pageable pageable);

    int countByRestaurantId(String restaurantId);
}
