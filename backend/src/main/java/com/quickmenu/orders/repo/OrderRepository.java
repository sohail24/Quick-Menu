package com.quickmenu.orders.repo;

import com.quickmenu.orders.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.math.BigDecimal;

public interface OrderRepository extends JpaRepository<Order, String>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Order> {
    List<Order> findByRestaurantId(String restaurantId);
    List<Order> findByRestaurantIdAndStatus(String restaurantId, Order.Status status);
    java.util.Optional<Order> findByRequestId(String requestId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.tableId = :tableId AND o.id <> :orderId AND o.status NOT IN :excludedStatuses")
    long countOtherActiveOrdersOnTable(
        @Param("tableId") String tableId, 
        @Param("orderId") String orderId, 
        @Param("excludedStatuses") java.util.List<com.quickmenu.orders.model.Order.Status> excludedStatuses
    );

    @Query("SELECT COUNT(o) FROM Order o WHERE o.tableId = :tableId AND o.status NOT IN :excludedStatuses")
    long countActiveOrdersOnTable(
        @Param("tableId") String tableId,
        @Param("excludedStatuses") java.util.List<com.quickmenu.orders.model.Order.Status> excludedStatuses
    );

    @Query("SELECT COUNT(o) FROM Order o WHERE o.tableId = :tableId AND o.status NOT IN :excludedStatuses AND o.paymentStatus <> :paidStatus")
    long countUnpaidActiveOrdersOnTable(
        @Param("tableId") String tableId,
        @Param("excludedStatuses") java.util.List<com.quickmenu.orders.model.Order.Status> excludedStatuses,
        @Param("paidStatus") com.quickmenu.orders.model.Order.PaymentStatus paidStatus
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM Order o WHERE o.isDemo = true")
    void deleteAllByIsDemoTrue();
    // Pageable variants
    Page<Order> findByRestaurantId(String restaurantId, Pageable pageable);
    Page<Order> findByRestaurantIdAndStatus(String restaurantId, Order.Status status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.restaurantId = :restaurantId " +
            "AND (LOWER(o.id) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> findByRestaurantIdAndSearch(
            @Param("restaurantId") String restaurantId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.restaurantId = :restaurantId " +
            "AND o.status = :status " +
            "AND (LOWER(o.id) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> findByRestaurantIdAndStatusAndSearch(
            @Param("restaurantId") String restaurantId,
            @Param("status") Order.Status status,
            @Param("search") String search,
            Pageable pageable);




    long countByRestaurantIdAndStatusIn(String restaurantId, List<Order.Status> statuses);

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
          AND placed_at >= :start
          AND placed_at <= :end
        GROUP BY DATE_TRUNC('hour', placed_at)
        ORDER BY DATE_TRUNC('hour', placed_at) ASC
    """, nativeQuery = true)
    List<Object[]> hourlyOrdersBetween(@Param("restaurantId") String restaurantId,
                                       @Param("start") java.time.Instant start,
                                       @Param("end") java.time.Instant end);
}
