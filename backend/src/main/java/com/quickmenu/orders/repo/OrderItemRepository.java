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

    @Query("""
      SELECT c.id AS categoryId,
             c.name AS categoryName,
             SUM(oi.quantity) AS totalQty
      FROM OrderItem oi
      JOIN oi.dish d
      LEFT JOIN Category c ON d.categoryId = c.id
      JOIN oi.order o
      WHERE o.restaurantId = :restaurantId
      GROUP BY c.id, c.name
      ORDER BY SUM(oi.quantity) DESC
    """)
    List<CategoryStatProjection> findCategoryStatsByRestaurant(@Param("restaurantId") String restaurantId);

    interface TopDishProjection {
        String getDishId();
        String getDishName();
        Long getTotalQty();
        java.math.BigDecimal getTotalRevenue();
    }

    interface CategoryStatProjection {
        String getCategoryId();
        String getCategoryName();
        Long getTotalQty();
    }
}
