package com.foodordering.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Food Ordering User Service - Spring Boot Application
 * 
 * This microservice handles user management, authentication, and profile operations
 * for the food ordering platform.
 * 
 * Features:
 * - User registration and authentication
 * - JWT token management
 * - Profile management with MongoDB
 * - Event publishing via RabbitMQ
 * - REST API with OpenAPI documentation
 */
@SpringBootApplication
@EnableFeignClients
@EnableMongoAuditing
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}