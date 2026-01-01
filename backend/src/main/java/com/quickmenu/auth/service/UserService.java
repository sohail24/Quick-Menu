package com.quickmenu.auth.service;

import com.quickmenu.auth.dto.SignUpRequest;
import com.quickmenu.auth.model.Role;
import com.quickmenu.auth.model.User;
import com.quickmenu.auth.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    Map<String, Role> roleMap = Map.of(
            "ADMIN", Role.ROLE_ADMIN,
            "STAFF", Role.ROLE_STAFF,
            "CUSTOMER", Role.ROLE_CUSTOMER
    );

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(SignUpRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = User.builder()
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .passwordHash(passwordEncoder.encode(signUpRequest.getPassword()))
                .role(roleMap.get(signUpRequest.getRole() != null ? signUpRequest.getRole().toUpperCase() : "ADMIN"))
                .enabled(signUpRequest.getEnable() != null ? signUpRequest.getEnable() : false) // by default disabled
                .build();
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public void deleteUserByEmail(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (Boolean.TRUE.equals(user.getIsDemo())) {
                user.setDeletedAt(java.time.Instant.now());
                userRepository.save(user);
            } else {
                userRepository.delete(user);
            }
        });
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void updatePassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
