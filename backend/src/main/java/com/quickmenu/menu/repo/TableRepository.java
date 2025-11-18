package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.TableEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TableRepository extends JpaRepository<TableEntity, String> {
    java.util.List<TableEntity> findByRestaurantId(String restaurantId);

    // Pageable variant
    Page<TableEntity> findByRestaurantId(String restaurantId, Pageable pageable);

    Optional<TableEntity> findByRestaurantIdAndName(String restaurantId, String name);
}
