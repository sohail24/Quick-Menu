package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.TableEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TableRepository extends JpaRepository<TableEntity, String> {
    java.util.List<TableEntity> findByRestaurantId(String restaurantId);

    // Pageable variant
    Page<TableEntity> findByRestaurantId(String restaurantId, Pageable pageable);
}
