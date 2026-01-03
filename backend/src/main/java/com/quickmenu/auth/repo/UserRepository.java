package com.quickmenu.auth.repo;

import com.quickmenu.auth.model.Role;
import com.quickmenu.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByAssignedRestaurantIdAndRole(String assignedRestaurantId, Role role);

    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE u.isDemo = true")
    void deleteAllByIsDemoTrue();
}