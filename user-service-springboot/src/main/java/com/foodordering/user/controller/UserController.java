package com.foodordering.user.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.foodordering.user.dto.AuthResponseDto;
import com.foodordering.user.dto.UserLoginDto;
import com.foodordering.user.dto.UserRegistrationDto;
import com.foodordering.user.dto.UserResponseDto;
import com.foodordering.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import com.foodordering.user.security.JwtUtil;

/**
 * REST Controller for User operations
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs for user registration, authentication, and profile management")
public class UserController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;
    
    /**
     * User registration endpoint
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Create a new user account with email and password")
    public ResponseEntity<AuthResponseDto> registerUser(@Valid @RequestBody UserRegistrationDto registrationDto) {
        AuthResponseDto response = userService.registerUser(registrationDto);
        
        if (response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    /**
     * User login endpoint
     */
    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate user with email and password")
    public ResponseEntity<AuthResponseDto> loginUser(@Valid @RequestBody UserLoginDto loginDto) {
        AuthResponseDto response = userService.loginUser(loginDto);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
    
    /**
     * Get user profile endpoint
     */
    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Get current user's profile information")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract user ID from JWT token (simplified for demo)
            String userId = extractUserIdFromAuthHeader(authHeader);
            
            Optional<UserResponseDto> userProfile = userService.getUserProfile(userId);
            
            if (userProfile.isPresent()) {
                return ResponseEntity.ok(userProfile.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }
    }
    
    /**
     * Update user profile endpoint
     */
    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Update current user's profile information")
    public ResponseEntity<?> updateUserProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UserResponseDto updateDto) {
        try {
            String userId = extractUserIdFromAuthHeader(authHeader);
            
            Optional<UserResponseDto> updatedProfile = userService.updateUserProfile(userId, updateDto);
            
            if (updatedProfile.isPresent()) {
                return ResponseEntity.ok(updatedProfile.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }
    }
    
    /**
     * Deactivate user account endpoint
     */
    @DeleteMapping("/profile")
    @Operation(summary = "Deactivate user account", description = "Deactivate current user's account")
    public ResponseEntity<?> deactivateUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String userId = extractUserIdFromAuthHeader(authHeader);
            
            boolean deactivated = userService.deactivateUser(userId);
            
            if (deactivated) {
                return ResponseEntity.ok(Map.of("message", "Account deactivated successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }
    }
    
    /**
     * Simple test endpoint for Bruno testing
     */
    @PostMapping("/test/simple-register")
    @Operation(summary = "Test registration endpoint", description = "Simple test endpoint for API validation")
    public ResponseEntity<?> testRegistration(@RequestBody UserRegistrationDto registrationDto) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Registration endpoint working",
                "data", registrationDto,
                "timestamp", java.time.LocalDateTime.now()
        ));
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    @Operation(summary = "Service health check", description = "Check if the user service is running")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "service", "user-service",
                "timestamp", java.time.LocalDateTime.now()
        ));
    }

    /**
     * User logout endpoint
     */
    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Logout user and invalidate token")
    public ResponseEntity<?> logoutUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Successfully logged out",
                    "timestamp", java.time.LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Logout failed: " + e.getMessage()));
        }
    }
    
    /**
     * Extract user ID from Authorization header (simplified implementation)
     */
    private String extractUserIdFromAuthHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Use the existing JwtUtil to extract user ID from token
                return jwtUtil.getUserIdFromToken(token);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid or expired token: " + e.getMessage());
            }
        }
        throw new IllegalArgumentException("Invalid authorization header");
    }

}