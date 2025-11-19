package com.foodordering.user.dto;

/**
 * Data Transfer Object for authentication response
 */
public class AuthResponseDto {
    
    private boolean success;
    private String message;
    private String token;
    private UserResponseDto user;
    
    // Constructors
    public AuthResponseDto() {
        // Default constructor for JSON deserialization
    }
    
    public AuthResponseDto(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public AuthResponseDto(boolean success, String message, String token, UserResponseDto user) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.user = user;
    }
    
    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public UserResponseDto getUser() {
        return user;
    }
    
    public void setUser(UserResponseDto user) {
        this.user = user;
    }
}