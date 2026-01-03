package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, String> {
    Optional<Restaurant> findByName(String name);

    Page<Restaurant> findAllByOwnerUserId(String ownerUserId, Pageable pageable);

    @Modifying
    @Transactional
    @Query("DELETE FROM Restaurant r WHERE r.isDemo = true")
    void deleteAllByIsDemoTrue();
}
