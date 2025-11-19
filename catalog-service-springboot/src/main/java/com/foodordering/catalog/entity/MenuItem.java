package com.foodordering.catalog.entity;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Document(collection = "menu_items")
public class MenuItem {
    
    @Id
    private String id;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;
    
    private String category;
    
    @Field("image_url")
    private String imageUrl;
    
    @Field("is_available")
    private Boolean isAvailable = true;
    
    private List<String> ingredients;
    
    @Field("allergen_info")
    private List<String> allergenInfo;
    
    @Field("nutritional_info")
    private NutritionalInfo nutritionalInfo;
    
    @Field("restaurant_id")
    @NotBlank(message = "Restaurant ID is required")
    private String restaurantId;

    // Constructors
    public MenuItem() {
    }

    public MenuItem(String name, String description, BigDecimal price, String category, 
                   String imageUrl, String restaurantId) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.imageUrl = imageUrl;
        this.restaurantId = restaurantId;
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

    public NutritionalInfo getNutritionalInfo() {
        return nutritionalInfo;
    }

    public void setNutritionalInfo(NutritionalInfo nutritionalInfo) {
        this.nutritionalInfo = nutritionalInfo;
    }

    public String getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(String restaurantId) {
        this.restaurantId = restaurantId;
    }

    // Nested class for nutritional information
    public static class NutritionalInfo {
        private Integer calories;
        private BigDecimal protein;
        private BigDecimal carbs;
        private BigDecimal fat;
        private BigDecimal fiber;

        // Constructors
        public NutritionalInfo() {
        }

        public NutritionalInfo(Integer calories, BigDecimal protein, BigDecimal carbs, 
                              BigDecimal fat, BigDecimal fiber) {
            this.calories = calories;
            this.protein = protein;
            this.carbs = carbs;
            this.fat = fat;
            this.fiber = fiber;
        }

        // Getters and Setters
        public Integer getCalories() {
            return calories;
        }

        public void setCalories(Integer calories) {
            this.calories = calories;
        }

        public BigDecimal getProtein() {
            return protein;
        }

        public void setProtein(BigDecimal protein) {
            this.protein = protein;
        }

        public BigDecimal getCarbs() {
            return carbs;
        }

        public void setCarbs(BigDecimal carbs) {
            this.carbs = carbs;
        }

        public BigDecimal getFat() {
            return fat;
        }

        public void setFat(BigDecimal fat) {
            this.fat = fat;
        }

        public BigDecimal getFiber() {
            return fiber;
        }

        public void setFiber(BigDecimal fiber) {
            this.fiber = fiber;
        }
    }
}