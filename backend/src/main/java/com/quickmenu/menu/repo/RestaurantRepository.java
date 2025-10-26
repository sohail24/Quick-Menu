package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantRepository extends JpaRepository<Restaurant, String> { }
