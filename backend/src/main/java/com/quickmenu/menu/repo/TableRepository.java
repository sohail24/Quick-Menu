package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TableRepository extends JpaRepository<TableEntity, String> {
    List<TableEntity> findByRestaurantId(String restaurantId);
}
