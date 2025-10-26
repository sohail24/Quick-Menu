package com.quickmenu.orders.repo;

import com.quickmenu.orders.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByRestaurantId(String restaurantId);
    List<Order> findByRestaurantIdAndStatus(String restaurantId, Order.Status status);
}
