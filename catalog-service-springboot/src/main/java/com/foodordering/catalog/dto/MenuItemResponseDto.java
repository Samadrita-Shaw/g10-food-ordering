package com.foodordering.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public class MenuItemResponseDto {
    
    private String id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String imageUrl;
    private Boolean isAvailable;
    private List<String> ingredients;
    private List<String> allergenInfo;
    private NutritionalInfoDto nutritionalInfo;
    private String restaurantId;

    // Constructors
    public MenuItemResponseDto() {
        // Default constructor for JSON serialization
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public List<String> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<String> ingredients) {
        this.ingredients = ingredients;
    }

    public List<String> getAllergenInfo() {
        return allergenInfo;
    }

    public void setAllergenInfo(List<String> allergenInfo) {
        this.allergenInfo = allergenInfo;
    }

    public NutritionalInfoDto getNutritionalInfo() {
        return nutritionalInfo;
    }

    public void setNutritionalInfo(NutritionalInfoDto nutritionalInfo) {
        this.nutritionalInfo = nutritionalInfo;
    }

    public String getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(String restaurantId) {
        this.restaurantId = restaurantId;
    }

    // Nested DTO for nutritional information
    public static class NutritionalInfoDto {
        private Integer calories;
        private BigDecimal protein;
        private BigDecimal carbs;
        private BigDecimal fat;
        private BigDecimal fiber;

        public NutritionalInfoDto() {
            // Default constructor for JSON serialization
        }

        // Getters and Setters
        public Integer getCalories() { return calories; }
        public void setCalories(Integer calories) { this.calories = calories; }
        public BigDecimal getProtein() { return protein; }
        public void setProtein(BigDecimal protein) { this.protein = protein; }
        public BigDecimal getCarbs() { return carbs; }
        public void setCarbs(BigDecimal carbs) { this.carbs = carbs; }
        public BigDecimal getFat() { return fat; }
        public void setFat(BigDecimal fat) { this.fat = fat; }
        public BigDecimal getFiber() { return fiber; }
        public void setFiber(BigDecimal fiber) { this.fiber = fiber; }
    }
}