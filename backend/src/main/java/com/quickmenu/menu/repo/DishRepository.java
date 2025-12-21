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

    Page<Dish> findByRestaurantIdAndCategoryId(String restaurantId, String categoryId, Pageable pageable);

    Page<Dish> findByRestaurantIdAndCategoryIdAndIsAvailableTrue(String restaurantId, String categoryId, Pageable pageable);

    Page<Dish> findByRestaurantIdAndCategoryIdAndNameContainingIgnoreCase(String restaurantId, String categoryId, String search, Pageable pageable);

    Page<Dish> findByRestaurantIdAndCategoryIdAndIsAvailableTrueAndNameContainingIgnoreCase(String restaurantId, String categoryId, String search, Pageable pageable);

    Page<Dish> findByRestaurantIdAndNameContainingIgnoreCase(String restaurantId, String search, Pageable pageable);

    Page<Dish> findByRestaurantIdAndIsAvailableTrueAndNameContainingIgnoreCase(String restaurantId, String search, Pageable pageable);
}
