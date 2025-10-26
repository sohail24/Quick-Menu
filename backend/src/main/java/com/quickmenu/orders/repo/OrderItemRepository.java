package com.quickmenu.orders.repo;

import com.quickmenu.orders.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    List<OrderItem> findByOrderId(String orderId);

    @Query("""
      SELECT oi.dishId AS dishId,
             SUM(oi.quantity) AS totalQty,
             SUM(oi.priceAtOrder * oi.quantity) AS totalRevenue
      FROM OrderItem oi
      JOIN Order o ON oi.orderId = o.id
      WHERE o.restaurantId = :restaurantId
      GROUP BY oi.dishId
      ORDER BY SUM(oi.quantity) DESC
    """)
    List<TopDishProjection> findTopDishesByRestaurant(@Param("restaurantId") String restaurantId);

    interface TopDishProjection {
        String getDishId();
        Long getTotalQty();
        java.math.BigDecimal getTotalRevenue();
    }
}
