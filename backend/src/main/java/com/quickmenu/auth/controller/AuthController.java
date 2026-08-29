package com.quickmenu.auth.controller;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import lombok.extern.slf4j.Slf4j;

import com.quickmenu.auth.dto.AuthResponse;
import com.quickmenu.auth.dto.LoginRequest;
import com.quickmenu.auth.dto.SignUpRequest;
import com.quickmenu.auth.model.User;
import com.quickmenu.auth.service.EmailSender;
import com.quickmenu.auth.service.JwtBlacklistService;
import com.quickmenu.auth.service.UserService;
import com.quickmenu.auth.security.CustomUserDetails;
import com.quickmenu.auth.security.JwtTokenProvider;
import com.quickmenu.auth.dto.PasswordRequests.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for Authentication")
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final EmailSender emailSender;
    private final JwtBlacklistService jwtBlacklistService;

    // Simple in-memory storage for reset tokens (email -> token)
    private final Map<String, String> resetTokens = new ConcurrentHashMap<>();

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserService userService,
                          EmailSender emailSender,
                          JwtBlacklistService jwtBlacklistService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userService = userService;
        this.emailSender = emailSender;
        this.jwtBlacklistService = jwtBlacklistService;
    }

    /**
     * Logout — blacklist the current JWT token in Redis.
     *
     * Microservices pattern: Stateless JWT logout via Redis blacklist.
     * The API Gateway checks this blacklist on every authenticated request.
     * TTL = remaining token lifetime → Redis auto-expires the key.
     */
    @PostMapping(value = "/logout", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Logout", description = "Invalidates the current JWT by adding it to the Redis blacklist")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Calculate remaining lifetime and blacklist with that TTL
                Date expiry = tokenProvider.parseClaims(token).getPayload().getExpiration();
                long remainingSeconds = (expiry.getTime() - Instant.now().toEpochMilli()) / 1000;
                if (remainingSeconds > 0) {
                    jwtBlacklistService.blacklist(token, Duration.ofSeconds(remainingSeconds));
                }
            } catch (Exception e) {
                // Token already invalid — fine, just clear context
            }
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping(value = "/signup", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Signup Endpoint", description = "Used for registering a new User (ADMIN/STAFF/CUSTOMER")
    @RateLimiter(name = "authApi")
    public ResponseEntity<?> register(@Valid @RequestBody SignUpRequest request) {
        User created = userService.registerUser(request);
        String token = tokenProvider.generateToken(created.getId(), created.getEmail(), created.getRole());
        return ResponseEntity.status(201).body(new AuthResponse(token, "Bearer", tokenProvider.parseClaims(token).getBody().getExpiration().getTime()));
    }

    @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Login Endpoint", description = "Used for logging existing User to the application (ADMIN/STAFF/CUSTOMER)")
    @RateLimiter(name = "authApi")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
        if (currentAuth != null && currentAuth.isAuthenticated()
                && !(currentAuth instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Already logged in. Please logout first.");
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        if (!principal.isEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Account is disabled. Contact administrator.");
        }
        String userId = (principal instanceof CustomUserDetails) ? ((CustomUserDetails) principal).getUserId() : null;
        String role = principal.getAuthorities().iterator().next().getAuthority();
        String token = tokenProvider.generateToken(userId, principal.getUsername(), com.quickmenu.auth.model.Role.valueOf(role));
        long expiresIn = tokenProvider.parseClaims(token).getBody().getExpiration().getTime();
        return ResponseEntity.ok(new AuthResponse(token, "Bearer", expiresIn));
    }

    @PostMapping(value = "/change-password", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Change Password", description = "Allows logged in users to change their password")
    public ResponseEntity<?> changePassword(Authentication auth, @Valid @RequestBody ChangePasswordRequest request) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        userService.changePassword(auth.getName(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping(value = "/forgot-password", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Forgot Password", description = "Initiates password reset flow (Sends Email)")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return userService.findByEmail(request.getEmail())
                .map(user -> {
                    String token = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    resetTokens.put(token, request.getEmail());
                    
                    // Send email
                    try {
                        emailSender.sendPasswordResetEmail(user.getEmail(), token);
                        return ResponseEntity.ok(Map.of("message", "Reset code sent to your email"));
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Map.of("message", "Failed to send reset email. Please try again later."));
                    }
                })
                .orElseThrow(
                        ()-> new IllegalArgumentException("Email does not exist, Please provide correct email.")
                );
    }

    @PostMapping(value = "/reset-password", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Reset Password", description = "Performs password reset using token")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String email = resetTokens.get(request.getToken());
        if (email == null) {
            return ResponseEntity.status(400).body(Map.of("message", "Invalid or expired token"));
        }
        userService.updatePassword(email, request.getNewPassword());
        resetTokens.remove(request.getToken());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
