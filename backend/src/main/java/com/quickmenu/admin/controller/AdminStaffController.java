package com.quickmenu.admin.controller;

import com.quickmenu.auth.model.Role;
import com.quickmenu.auth.model.User;
import com.quickmenu.auth.repo.UserRepository;
import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/staff")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStaffController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminStaffController(UserRepository userRepo,
                                PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // 1️⃣ List staff by restaurant
    @GetMapping
    public List<User> list(@RequestParam String restaurantId) {
        return userRepo.findByAssignedRestaurantIdAndRole(restaurantId, Role.ROLE_STAFF);
    }

    // 2️⃣ Create staff
    @PostMapping
    public User create(@Valid @RequestBody CreateStaffRequest req) {
        User u = new User();
        u.setName(req.getName());
        u.setEmail(req.getEmail());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setRole(Role.ROLE_STAFF);
        u.setAssignedRestaurantId(req.getRestaurantId());
        u.setEnabled(true);
        u.setCreatedAt(Instant.now());
        return userRepo.save(u);
    }

    // 3️⃣ Enable / Disable staff
    @PatchMapping("/{userId}/enabled")
    public User toggle(@PathVariable String userId,
                       @RequestParam boolean enabled) {
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        u.setEnabled(enabled);
        return userRepo.save(u);
    }

    // 4️⃣ Delete staff
    @DeleteMapping("/{userId}")
    public void delete(@PathVariable String userId) {
        userRepo.deleteById(userId);
    }

    // -------- DTO --------
    @Data
    public static class CreateStaffRequest {
        private String name;
        private String email;
        private String password;
        private String restaurantId;
    }
}
