package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Dish;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface DishRepository extends JpaRepository<Dish, String>, JpaSpecificationExecutor<Dish> {
    List<Dish> findByRestaurantIdAndIsAvailableTrue(String restaurantId);
    List<Dish> findByRestaurantId(String restaurantId);
    void deleteAllByIsDemoTrue();

    // Pageable variants
    Page<Dish> findByRestaurantId(String restaurantId, Pageable pageable);
    Page<Dish> findByRestaurantIdAndIsAvailableTrue(String restaurantId, Pageable pageable);
    long countByRestaurantId(String restaurantId);
}
