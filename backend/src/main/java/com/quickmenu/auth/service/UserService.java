package com.quickmenu.auth.service;

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

    public User registerUser(String name, String email, String rawPassword, String role) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(roleMap.get(role != null ? role.toUpperCase() : "CUSTOMER"))
                .build();
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
