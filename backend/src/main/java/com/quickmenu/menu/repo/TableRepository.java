package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.TableEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TableRepository extends JpaRepository<TableEntity, String> {
    java.util.List<TableEntity> findByRestaurantId(String restaurantId);

    // Pageable variant
    Page<TableEntity> findByRestaurantId(String restaurantId, Pageable pageable);

    Optional<TableEntity> findByRestaurantIdAndName(String restaurantId, String name);

    // find tables that are not occupied for a restaurant
    List<TableEntity> findByRestaurantIdAndOccupiedFalse(String restaurantId);

    long countByRestaurantIdAndOccupiedTrue(String restaurantId);
    long countByRestaurantIdAndOccupiedFalse(String restaurantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from TableEntity t where t.id = :id")
    Optional<TableEntity> findByIdForUpdate(@Param("id") String id);


}
