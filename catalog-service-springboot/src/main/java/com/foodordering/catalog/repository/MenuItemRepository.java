package com.foodordering.catalog.repository;

import com.foodordering.catalog.entity.MenuItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface MenuItemRepository extends MongoRepository<MenuItem, String> {
    
    // Find menu items by restaurant ID
    List<MenuItem> findByRestaurantIdAndIsAvailableTrue(String restaurantId);
    
    // Page menu items by restaurant ID
    Page<MenuItem> findByRestaurantIdAndIsAvailableTrue(String restaurantId, Pageable pageable);
    
    // Find by category
    List<MenuItem> findByRestaurantIdAndCategoryAndIsAvailableTrue(String restaurantId, String category);
    
    // Find by price range
    List<MenuItem> findByRestaurantIdAndPriceBetweenAndIsAvailableTrue(
            String restaurantId, BigDecimal minPrice, BigDecimal maxPrice);
    
    // Search menu items by name
    @Query("{ $and: [ " +
           "  { 'restaurantId': ?0 }, " +
           "  { 'name': { $regex: ?1, $options: 'i' } }, " +
           "  { 'isAvailable': true } " +
           "] }")
    List<MenuItem> searchByRestaurantIdAndName(String restaurantId, String searchTerm);
    
    // Find all available menu items (for admin)
    List<MenuItem> findByIsAvailableTrue();
    
    // Find by multiple categories
    @Query("{ $and: [ " +
           "  { 'restaurantId': ?0 }, " +
           "  { 'category': { $in: ?1 } }, " +
           "  { 'isAvailable': true } " +
           "] }")
    List<MenuItem> findByRestaurantIdAndCategoriesIn(String restaurantId, List<String> categories);
    
    // Count menu items by restaurant
    long countByRestaurantIdAndIsAvailableTrue(String restaurantId);
    
    // Find by ingredients containing (for dietary restrictions)
    @Query("{ $and: [ " +
           "  { 'restaurantId': ?0 }, " +
           "  { 'ingredients': { $in: ?1 } }, " +
           "  { 'isAvailable': true } " +
           "] }")
    List<MenuItem> findByRestaurantIdAndIngredientsContaining(String restaurantId, List<String> ingredients);
    
    // Find distinct categories by restaurant
    @Query(value = "{ 'restaurantId': ?0, 'isAvailable': true }", fields = "{ 'category': 1 }")
    List<MenuItem> findDistinctCategoriesByRestaurantId(String restaurantId);
    
    // Find menu items without allergens
    @Query("{ $and: [ " +
           "  { 'restaurantId': ?0 }, " +
           "  { 'allergenInfo': { $nin: ?1 } }, " +
           "  { 'isAvailable': true } " +
           "] }")
    List<MenuItem> findByRestaurantIdAndAllergenInfoNotIn(String restaurantId, List<String> allergens);
}