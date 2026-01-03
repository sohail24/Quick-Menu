package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {
    List<Category> findByRestaurantIdOrderByOrderIndex(String restaurantId);

    // Pageable variant (order by orderIndex)
    Page<Category> findByRestaurantId(String restaurantId, Pageable pageable);

    Optional<Category> findByRestaurantIdAndName(String restaurantId, String name);

    @Modifying
    @Transactional
    @Query("DELETE FROM Category c WHERE c.isDemo = true")
    void deleteAllByIsDemoTrue();
}
