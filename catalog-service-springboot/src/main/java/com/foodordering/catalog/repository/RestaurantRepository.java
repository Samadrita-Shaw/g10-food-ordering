package com.foodordering.catalog.repository;

import com.foodordering.catalog.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends MongoRepository<Restaurant, String> {
    
    // Find active restaurants
    List<Restaurant> findByIsActiveTrue();
    
    // Page active restaurants
    Page<Restaurant> findByIsActiveTrue(Pageable pageable);
    
    // Find by cuisine type
    List<Restaurant> findByCuisineTypesContainingAndIsActiveTrue(String cuisineType);
    
    // Find by name (case insensitive)
    Optional<Restaurant> findByNameIgnoreCase(String name);
    
    // Search restaurants by name or description
    @Query("{ $and: [ " +
           "  { $or: [ " +
           "    { 'name': { $regex: ?0, $options: 'i' } }, " +
           "    { 'description': { $regex: ?0, $options: 'i' } } " +
           "  ] }, " +
           "  { 'isActive': true } " +
           "] }")
    List<Restaurant> searchByNameOrDescription(String searchTerm);
    
    // Find restaurants by location (within radius)
    @Query("{ $and: [ " +
           "  { 'address.latitude': { $exists: true } }, " +
           "  { 'address.longitude': { $exists: true } }, " +
           "  { 'isActive': true } " +
           "] }")
    List<Restaurant> findRestaurantsWithLocation();
    
    // Find by rating range
    List<Restaurant> findByRatingGreaterThanEqualAndIsActiveTrue(Double minRating);
    
    // Find by city
    List<Restaurant> findByAddressCityIgnoreCaseAndIsActiveTrue(String city);
    
    // Count active restaurants
    long countByIsActiveTrue();
    
    // Find restaurants by multiple cuisine types
    @Query("{ $and: [ " +
           "  { 'cuisineTypes': { $in: ?0 } }, " +
           "  { 'isActive': true } " +
           "] }")
    List<Restaurant> findByCuisineTypesIn(List<String> cuisineTypes);
}