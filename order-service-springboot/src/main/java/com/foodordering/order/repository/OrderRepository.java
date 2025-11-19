package com.foodordering.order.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.foodordering.order.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    
    // Find orders by user
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    
    // Find orders by user with pagination
    Page<Order> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    // Find orders by restaurant
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(String restaurantId);
    
    // Find orders by status
    List<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status);
    
    // Find orders by user and status
    List<Order> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, Order.OrderStatus status);
    
    // Find orders by restaurant and status
    List<Order> findByRestaurantIdAndStatusOrderByCreatedAtDesc(String restaurantId, Order.OrderStatus status);
    
    // Find orders created within date range
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findOrdersByDateRange(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    // Find orders by multiple statuses
    List<Order> findByStatusInOrderByCreatedAtDesc(List<Order.OrderStatus> statuses);
    
    // Count orders by status
    long countByStatus(Order.OrderStatus status);
    
    // Count orders by user
    long countByUserId(String userId);
    
    // Count orders by restaurant
    long countByRestaurantId(String restaurantId);
    
    // Find recent orders (last 24 hours)
    @Query("SELECT o FROM Order o WHERE o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(@Param("since") LocalDateTime since);
    
    // Find orders ready for delivery
    List<Order> findByStatusInAndDeliveryAddressIsNotNull(List<Order.OrderStatus> statuses);
}