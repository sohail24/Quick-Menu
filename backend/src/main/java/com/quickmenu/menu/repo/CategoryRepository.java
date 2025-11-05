package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, String> {
    List<Category> findByRestaurantIdOrderByOrderIndex(String restaurantId);

    // Pageable variant (order by orderIndex)
    Page<Category> findByRestaurantId(String restaurantId, Pageable pageable);
}
