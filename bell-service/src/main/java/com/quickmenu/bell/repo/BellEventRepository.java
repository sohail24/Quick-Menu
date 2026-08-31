package com.quickmenu.bell.repo;

import com.quickmenu.bell.model.BellEvent;
import com.quickmenu.bell.model.BellEvent.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface BellEventRepository extends JpaRepository<BellEvent, String> {
    Page<BellEvent> findByRestaurantId(String restaurantId, Pageable pageable);
    Page<BellEvent> findByRestaurantIdAndStatus(String restaurantId, Status status, Pageable pageable);
    List<BellEvent> findByRestaurantIdAndStatusAndCreatedAtAfter(String restaurantId, Status status, Instant since);
}
