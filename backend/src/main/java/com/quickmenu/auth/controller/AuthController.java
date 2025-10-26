package com.quickmenu.auth.controller;

import com.quickmenu.auth.dto.AuthResponse;
import com.quickmenu.auth.dto.LoginRequest;
import com.quickmenu.auth.dto.SignUpRequest;
import com.quickmenu.auth.model.User;
import com.quickmenu.auth.service.UserService;
import com.quickmenu.security.CustomUserDetails;
import com.quickmenu.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> register(@Valid @RequestBody SignUpRequest request) {
        User created = userService.registerAdmin(request.getName(), request.getEmail(), request.getPassword());
        String token = tokenProvider.generateToken(created.getId(), created.getEmail(), created.getRole());
        return ResponseEntity.status(201).body(new AuthResponse(token, "Bearer", tokenProvider.parseClaims(token).getBody().getExpiration().getTime()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        String userId = (principal instanceof CustomUserDetails) ? ((CustomUserDetails) principal).getUserId() : null;
        // role extraction not strictly necessary here
        String role = principal.getAuthorities().iterator().next().getAuthority();
        // generate token
        String token = tokenProvider.generateToken(userId, principal.getUsername(), com.quickmenu.auth.model.Role.valueOf(role));
        long expiresIn = tokenProvider.parseClaims(token).getBody().getExpiration().getTime();
        return ResponseEntity.ok(new AuthResponse(token, "Bearer", expiresIn));
    }
}
