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
                .role(roleMap.get(signUpRequest.getRole() != null ? signUpRequest.getRole().toUpperCase() : "CUSTOMER"))
                .enabled(signUpRequest.getEnable() != null ? signUpRequest.getEnable() : false) // by default disabled
                .build();
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
