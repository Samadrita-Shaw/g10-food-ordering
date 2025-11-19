package com.foodordering.user.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.foodordering.user.dto.AuthResponseDto;
import com.foodordering.user.dto.UserLoginDto;
import com.foodordering.user.dto.UserRegistrationDto;
import com.foodordering.user.dto.UserResponseDto;
import com.foodordering.user.model.User;
import com.foodordering.user.repository.UserRepository;
import com.foodordering.user.security.JwtUtil;

/**
 * Service class for user operations
 */
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    /**
     * Register a new user
     */
    public AuthResponseDto registerUser(UserRegistrationDto registrationDto) {
        try {
            // Check if user already exists
            if (userRepository.existsByEmail(registrationDto.getEmail())) {
                return new AuthResponseDto(false, "User already exists with this email");
            }
            
            // Create new user
            User user = new User();
            user.setEmail(registrationDto.getEmail());
            user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
            user.setName(registrationDto.getName());
            user.setPhone(registrationDto.getPhone());
            user.setRole(registrationDto.getRole());
            
            // Save user
            User savedUser = userRepository.save(user);
            
            // Generate JWT token
            String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());
            
            // Convert to response DTO
            UserResponseDto userResponse = convertToResponseDto(savedUser);
            
            // TODO: Publish user registered event (implement event publishing later)
            
            return new AuthResponseDto(true, "User registered successfully", token, userResponse);
            
        } catch (Exception e) {
            return new AuthResponseDto(false, "Registration failed: " + e.getMessage());
        }
    }
    
    /**
     * Authenticate user login
     */
    public AuthResponseDto loginUser(UserLoginDto loginDto) {
        try {
            // Find user by email
            Optional<User> userOptional = userRepository.findByEmailAndIsActive(loginDto.getEmail(), true);
            
            if (userOptional.isEmpty()) {
                return new AuthResponseDto(false, "Invalid email or password");
            }
            
            User user = userOptional.get();
            
            // Check password
            if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
                return new AuthResponseDto(false, "Invalid email or password");
            }
            
            // Generate JWT token
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
            
            // Convert to response DTO
            UserResponseDto userResponse = convertToResponseDto(user);
            
            // TODO: Publish login event (implement event publishing later)
            
            return new AuthResponseDto(true, "Login successful", token, userResponse);
            
        } catch (Exception e) {
            return new AuthResponseDto(false, "Login failed: " + e.getMessage());
        }
    }
    
    /**
     * Get user profile by ID
     */
    public Optional<UserResponseDto> getUserProfile(String userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        return userOptional.map(this::convertToResponseDto);
    }
    
    /**
     * Update user profile
     */
    public Optional<UserResponseDto> updateUserProfile(String userId, UserResponseDto updateDto) {
        Optional<User> userOptional = userRepository.findById(userId);
        
        if (userOptional.isEmpty()) {
            return Optional.empty();
        }
        
        User user = userOptional.get();
        
        // Update fields
        if (updateDto.getName() != null) {
            user.setName(updateDto.getName());
        }
        if (updateDto.getPhone() != null) {
            user.setPhone(updateDto.getPhone());
        }
        if (updateDto.getAddresses() != null) {
            user.setAddresses(updateDto.getAddresses());
        }
        if (updateDto.getPreferences() != null) {
            user.setPreferences(updateDto.getPreferences());
        }
        
        User updatedUser = userRepository.save(user);
        
        // Publish user updated event
        // TODO: Publish user updated event (implement event publishing later)
        
        return Optional.of(convertToResponseDto(updatedUser));
    }
    
    /**
     * Deactivate user account
     */
    public boolean deactivateUser(String userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        user.setActive(false);
        userRepository.save(user);
        
        // Publish user deactivated event
        // TODO: Publish user deactivated event (implement event publishing later)
        
        return true;
    }
    
    /**
     * Convert User entity to UserResponseDto
     */
    private UserResponseDto convertToResponseDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setAddresses(user.getAddresses());
        dto.setPreferences(user.getPreferences());
        dto.setActive(user.isActive());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}