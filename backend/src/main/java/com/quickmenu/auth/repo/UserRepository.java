package com.quickmenu.auth.repo;

import com.quickmenu.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    List<User> findByRestaurantIdAndRole(String restaurantId, String role);
}