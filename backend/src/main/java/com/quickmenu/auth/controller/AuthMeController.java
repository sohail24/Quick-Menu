package com.quickmenu.auth.controller;

import com.quickmenu.auth.model.User;
import com.quickmenu.auth.service.UserService;
import com.quickmenu.auth.dto.UserProfileResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthMeController {

    private final UserService userService;

    public AuthMeController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = auth.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfileResponse dto = UserProfileResponse.from(user);
        return ResponseEntity.ok(dto);
    }
}
