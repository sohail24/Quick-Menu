package com.quickmenu.config;

import com.quickmenu.auth.model.User;
import com.quickmenu.auth.repo.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("admin@quickmenu.local")) {
                User admin = User.builder()
                        .name("Admin")
                        .email("admin@quickmenu.local")
                        .passwordHash(passwordEncoder.encode("Admin123!"))
                        .role(com.quickmenu.auth.model.Role.ROLE_ADMIN)
                        .build();
                userRepository.save(admin);
                System.out.println("Seeded admin@quickmenu.local / Admin123!");
            }
        };
    }
}
