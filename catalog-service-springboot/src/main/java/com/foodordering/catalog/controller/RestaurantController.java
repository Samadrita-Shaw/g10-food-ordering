package com.foodordering.catalog.controller;

import com.foodordering.catalog.dto.RestaurantCreateDto;
import com.foodordering.catalog.dto.RestaurantResponseDto;
import com.foodordering.catalog.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RestaurantController {

    private final RestaurantService restaurantService;

    @Autowired
    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    // Create a new restaurant
    @PostMapping
    public ResponseEntity<RestaurantResponseDto> createRestaurant(
            @Valid @RequestBody RestaurantCreateDto restaurantDto) {
        RestaurantResponseDto createdRestaurant = restaurantService.createRestaurant(restaurantDto);
        return new ResponseEntity<>(createdRestaurant, HttpStatus.CREATED);
    }

    // Get all active restaurants with pagination
    @GetMapping
    public ResponseEntity<Page<RestaurantResponseDto>> getAllRestaurants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<RestaurantResponseDto> restaurants = restaurantService.getActiveRestaurants(pageable);
        return ResponseEntity.ok(restaurants);
    }

    // Get restaurant by ID
    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponseDto> getRestaurantById(@PathVariable String id) {
        return restaurantService.getRestaurantById(id)
                .map(restaurant -> ResponseEntity.ok(restaurant))
                .orElse(ResponseEntity.notFound().build());
    }

    // Update restaurant
    @PutMapping("/{id}")
    public ResponseEntity<RestaurantResponseDto> updateRestaurant(
            @PathVariable String id,
            @Valid @RequestBody RestaurantCreateDto restaurantDto) {
        return restaurantService.updateRestaurant(id, restaurantDto)
                .map(restaurant -> ResponseEntity.ok(restaurant))
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete (deactivate) restaurant
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRestaurant(@PathVariable String id) {
        boolean deleted = restaurantService.deleteRestaurant(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Restaurant deactivated successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Search restaurants
    @GetMapping("/search")
    public ResponseEntity<List<RestaurantResponseDto>> searchRestaurants(
            @RequestParam String query) {
        List<RestaurantResponseDto> restaurants = restaurantService.searchRestaurants(query);
        return ResponseEntity.ok(restaurants);
    }

    // Get restaurants by cuisine type
    @GetMapping("/cuisine/{cuisineType}")
    public ResponseEntity<List<RestaurantResponseDto>> getRestaurantsByCuisine(
            @PathVariable String cuisineType) {
        List<RestaurantResponseDto> restaurants = restaurantService.getRestaurantsByCuisine(cuisineType);
        return ResponseEntity.ok(restaurants);
    }

    // Get restaurants by city
    @GetMapping("/city/{city}")
    public ResponseEntity<List<RestaurantResponseDto>> getRestaurantsByCity(
            @PathVariable String city) {
        List<RestaurantResponseDto> restaurants = restaurantService.getRestaurantsByCity(city);
        return ResponseEntity.ok(restaurants);
    }

    // Get restaurants by minimum rating
    @GetMapping("/rating/{minRating}")
    public ResponseEntity<List<RestaurantResponseDto>> getRestaurantsByRating(
            @PathVariable Double minRating) {
        List<RestaurantResponseDto> restaurants = restaurantService.getRestaurantsByMinRating(minRating);
        return ResponseEntity.ok(restaurants);
    }

    // Get restaurants by multiple cuisine types
    @PostMapping("/cuisines")
    public ResponseEntity<List<RestaurantResponseDto>> getRestaurantsByCuisines(
            @RequestBody List<String> cuisineTypes) {
        List<RestaurantResponseDto> restaurants = restaurantService.getRestaurantsByCuisines(cuisineTypes);
        return ResponseEntity.ok(restaurants);
    }

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "catalog-service",
                "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }
}