package com.foodordering.order.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.foodordering.order.entity.Order;
import com.foodordering.order.repository.OrderRepository;
import com.foodordering.order.security.JwtUtil;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrderController {

    private final OrderRepository orderRepository;
    private final JwtUtil jwtUtil;

    @Autowired
    public OrderController(OrderRepository orderRepository, JwtUtil jwtUtil) {
        this.orderRepository = orderRepository;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Helper method to validate JWT token and extract user information
     */
    private ResponseEntity<String> validateTokenAndGetUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }

        String userId = jwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(userId);
    }

    /**
     * Helper method to check if user has admin privileges
     */
    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return false;
        }
        
        String role = jwtUtil.getRoleFromToken(token);
        return "ADMIN".equalsIgnoreCase(role) || "RESTAURANT_OWNER".equalsIgnoreCase(role);
    }

    // Create a new order - Requires authentication
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestHeader("Authorization") String authHeader, 
                                       @RequestBody Order order) {
        ResponseEntity<String> authResult = validateTokenAndGetUserId(authHeader);
        if (authResult.getStatusCode() != HttpStatus.OK) {
            return ResponseEntity.status(authResult.getStatusCode())
                    .body(Map.of("error", "Authentication failed", "message", authResult.getBody()));
        }

        String userId = authResult.getBody();
        
        // Set the authenticated user as the order owner
        order.setUserId(userId);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        
        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
    }

    // Get all orders - Admin only
    @GetMapping
    public ResponseEntity<?> getAllOrders(@RequestHeader("Authorization") String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied", "message", "Admin privileges required"));
        }

        List<Order> orders = orderRepository.findAll();
        return ResponseEntity.ok(orders);
    }

    // Get order by ID - User can only access their own orders, admins can access all
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@RequestHeader("Authorization") String authHeader, 
                                        @PathVariable String id) {
        ResponseEntity<String> authResult = validateTokenAndGetUserId(authHeader);
        if (authResult.getStatusCode() != HttpStatus.OK) {
            return ResponseEntity.status(authResult.getStatusCode())
                    .body(Map.of("error", "Authentication failed", "message", authResult.getBody()));
        }

        String userId = authResult.getBody();
        
        return orderRepository.findById(id)
                .map(order -> {
                    // Users can only access their own orders, admins can access all
                    if (!userId.equals(order.getUserId()) && !isAdmin(authHeader)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "Access denied", "message", "You can only access your own orders"));
                    }
                    return ResponseEntity.ok(order);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Get orders by user - Users can only access their own orders, admins can access any user's orders
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getOrdersByUser(@RequestHeader("Authorization") String authHeader, 
                                           @PathVariable String userId) {
        ResponseEntity<String> authResult = validateTokenAndGetUserId(authHeader);
        if (authResult.getStatusCode() != HttpStatus.OK) {
            return ResponseEntity.status(authResult.getStatusCode())
                    .body(Map.of("error", "Authentication failed", "message", authResult.getBody()));
        }

        String authenticatedUserId = authResult.getBody();
        
        // Users can only access their own orders, admins can access any user's orders
        if (!authenticatedUserId.equals(userId) && !isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied", "message", "You can only access your own orders"));
        }

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(orders);
    }

    // Get current user's orders - Authenticated users get their own orders
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@RequestHeader("Authorization") String authHeader) {
        ResponseEntity<String> authResult = validateTokenAndGetUserId(authHeader);
        if (authResult.getStatusCode() != HttpStatus.OK) {
            return ResponseEntity.status(authResult.getStatusCode())
                    .body(Map.of("error", "Authentication failed", "message", authResult.getBody()));
        }

        String userId = authResult.getBody();
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(orders);
    }

    // Get orders by restaurant - Admin or restaurant owner only
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<?> getOrdersByRestaurant(@RequestHeader("Authorization") String authHeader, 
                                                  @PathVariable String restaurantId) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied", "message", "Admin or restaurant owner privileges required"));
        }

        List<Order> orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        return ResponseEntity.ok(orders);
    }

    // Get orders by status - Admin only
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getOrdersByStatus(@RequestHeader("Authorization") String authHeader, 
                                             @PathVariable Order.OrderStatus status) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied", "message", "Admin privileges required"));
        }

        List<Order> orders = orderRepository.findByStatusOrderByCreatedAtDesc(status);
        return ResponseEntity.ok(orders);
    }

    // Update order status - Admin or order owner only
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@RequestHeader("Authorization") String authHeader, 
                                             @PathVariable String id, 
                                             @RequestBody Map<String, String> statusUpdate) {
        ResponseEntity<String> authResult = validateTokenAndGetUserId(authHeader);
        if (authResult.getStatusCode() != HttpStatus.OK) {
            return ResponseEntity.status(authResult.getStatusCode())
                    .body(Map.of("error", "Authentication failed", "message", authResult.getBody()));
        }

        String userId = authResult.getBody();
        
        return orderRepository.findById(id)
                .map(order -> {
                    // Users can only update their own orders, admins can update any order
                    if (!userId.equals(order.getUserId()) && !isAdmin(authHeader)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "Access denied", "message", "You can only update your own orders"));
                    }
                    
                    Order.OrderStatus newStatus = Order.OrderStatus.valueOf(statusUpdate.get("status"));
                    order.updateStatus(newStatus);
                    Order updatedOrder = orderRepository.save(order);
                    return ResponseEntity.ok(updatedOrder);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Get recent orders (last 24 hours) - Admin only
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentOrders(@RequestHeader("Authorization") String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied", "message", "Admin privileges required"));
        }

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        List<Order> orders = orderRepository.findRecentOrders(since);
        return ResponseEntity.ok(orders);
    }

    // Health check endpoint - No authentication required
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "order-service",
                "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }

    // Get order statistics - Admin only
    @GetMapping("/stats")
    public ResponseEntity<?> getOrderStats(@RequestHeader("Authorization") String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied", "message", "Admin privileges required"));
        }
        
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(Order.OrderStatus.PENDING);
        long confirmedOrders = orderRepository.countByStatus(Order.OrderStatus.CONFIRMED);
        long deliveredOrders = orderRepository.countByStatus(Order.OrderStatus.DELIVERED);
        
        Map<String, Object> stats = Map.of(
                "totalOrders", totalOrders,
                "pendingOrders", pendingOrders,
                "confirmedOrders", confirmedOrders,
                "deliveredOrders", deliveredOrders
        );
        
        return ResponseEntity.ok(stats);
    }
}