package com.foodordering.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.foodordering.user.model.User;

/**
 * Repository interface for User entity
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    /**
     * Find user by email address
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Find user by email and active status
     */
    Optional<User> findByEmailAndIsActive(String email, boolean isActive);
    
    /**
     * Check if user exists by email
     */
    boolean existsByEmail(String email);
    
    /**
     * Find users by role
     */
    List<User> findByRole(String role);
    
    /**
     * Find active users
     */
    List<User> findByIsActive(boolean isActive);
    
    /**
     * Find users by phone number
     */
    Optional<User> findByPhone(String phone);
    
    /**
     * Find users by name containing (case insensitive)
     */
    @Query("{'name': {$regex: ?0, $options: 'i'}}")
    List<User> findByNameContainingIgnoreCase(String name);
    
    /**
     * Count users by role
     */
    long countByRole(String role);
    
    /**
     * Count active users
     */
    long countByIsActive(boolean isActive);
}