package com.quickmenu.orders.repo;

import com.quickmenu.orders.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.math.BigDecimal;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByRestaurantId(String restaurantId);
    List<Order> findByRestaurantIdAndStatus(String restaurantId, Order.Status status);
    // Pageable variants
    Page<Order> findByRestaurantId(String restaurantId, Pageable pageable);
    Page<Order> findByRestaurantIdAndStatus(String restaurantId, Order.Status status, Pageable pageable);


    long countByRestaurantIdAndPlacedAtBetween(String restaurantId, Instant start, Instant end);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where o.restaurantId = :rid and o.placedAt between :start and :end")
    BigDecimal sumTotalAmountByRestaurantIdAndPlacedAtBetween(@Param("rid") String restaurantId,
                                                              @Param("start") Instant start,
                                                              @Param("end") Instant end);

    @Query(value = """
        SELECT DATE_TRUNC('hour', placed_at) AS hour_start,
               COUNT(*) AS orders_count
        FROM orders
        WHERE restaurant_id = :restaurantId
          AND placed_at >= :since
        GROUP BY DATE_TRUNC('hour', placed_at)
        ORDER BY DATE_TRUNC('hour', placed_at) ASC
    """, nativeQuery = true)
    List<Object[]> hourlyOrdersSince(@Param("restaurantId") String restaurantId, @Param("since") java.time.Instant since);
}
