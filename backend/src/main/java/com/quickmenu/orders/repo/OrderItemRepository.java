package com.quickmenu.orders.repo;

import com.quickmenu.orders.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    List<OrderItem> findByOrder_Id(String orderId);

    @Query("""
      SELECT oi.dish.id AS dishId,
             oi.dish.name AS dishName,
             SUM(oi.quantity) AS totalQty,
             SUM(oi.priceAtOrder * oi.quantity) AS totalRevenue
      FROM OrderItem oi
      JOIN oi.order o
      WHERE o.restaurantId = :restaurantId
      GROUP BY oi.dish.id, oi.dish.name
      ORDER BY SUM(oi.quantity) DESC
    """)
    List<TopDishProjection> findTopDishesByRestaurant(@Param("restaurantId") String restaurantId);

    interface TopDishProjection {
        String getDishId();
        String getDishName();      // add dishName to projection
        Long getTotalQty();
        java.math.BigDecimal getTotalRevenue();
    }
}
