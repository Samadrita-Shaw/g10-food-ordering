package com.foodordering.catalog.dto;

import java.time.LocalDateTime;
import java.util.List;

public class RestaurantResponseDto {
    
    private String id;
    private String name;
    private String description;
    private String imageUrl;
    private AddressDto address;
    private String phone;
    private String email;
    private String website;
    private List<String> cuisineTypes;
    private OpeningHoursDto openingHours;
    private DeliveryInfoDto deliveryInfo;
    private Double rating;
    private Integer reviewCount;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public RestaurantResponseDto() {
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public AddressDto getAddress() {
        return address;
    }

    public void setAddress(AddressDto address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public List<String> getCuisineTypes() {
        return cuisineTypes;
    }

    public void setCuisineTypes(List<String> cuisineTypes) {
        this.cuisineTypes = cuisineTypes;  
    }

    public OpeningHoursDto getOpeningHours() {
        return openingHours;
    }

    public void setOpeningHours(OpeningHoursDto openingHours) {
        this.openingHours = openingHours;
    }

    public DeliveryInfoDto getDeliveryInfo() {
        return deliveryInfo;
    }

    public void setDeliveryInfo(DeliveryInfoDto deliveryInfo) {
        this.deliveryInfo = deliveryInfo;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Nested DTOs (reusing from RestaurantCreateDto)
    public static class AddressDto {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        private Double latitude;
        private Double longitude;

        public AddressDto() {
            // Default constructor for JSON serialization
        }

        // Getters and Setters
        public String getStreet() { return street; }
        public void setStreet(String street) { this.street = street; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getZipCode() { return zipCode; }
        public void setZipCode(String zipCode) { this.zipCode = zipCode; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }

    public static class OpeningHoursDto {
        private String monday;
        private String tuesday;
        private String wednesday;
        private String thursday;
        private String friday;
        private String saturday;
        private String sunday;

        public OpeningHoursDto() {
            // Default constructor for JSON serialization
        }

        // Getters and Setters
        public String getMonday() { return monday; }
        public void setMonday(String monday) { this.monday = monday; }
        public String getTuesday() { return tuesday; }
        public void setTuesday(String tuesday) { this.tuesday = tuesday; }
        public String getWednesday() { return wednesday; }
        public void setWednesday(String wednesday) { this.wednesday = wednesday; }
        public String getThursday() { return thursday; }
        public void setThursday(String thursday) { this.thursday = thursday; }
        public String getFriday() { return friday; }
        public void setFriday(String friday) { this.friday = friday; }
        public String getSaturday() { return saturday; }
        public void setSaturday(String saturday) { this.saturday = saturday; }
        public String getSunday() { return sunday; }
        public void setSunday(String sunday) { this.sunday = sunday; }
    }

    public static class DeliveryInfoDto {
        private Integer deliveryTimeMinutes;
        private Double deliveryFee;
        private Double minimumOrderAmount;
        private Double maxDeliveryDistance;

        public DeliveryInfoDto() {
            // Default constructor for JSON serialization
        }

        // Getters and Setters
        public Integer getDeliveryTimeMinutes() { return deliveryTimeMinutes; }
        public void setDeliveryTimeMinutes(Integer deliveryTimeMinutes) { this.deliveryTimeMinutes = deliveryTimeMinutes; }
        public Double getDeliveryFee() { return deliveryFee; }
        public void setDeliveryFee(Double deliveryFee) { this.deliveryFee = deliveryFee; }
        public Double getMinimumOrderAmount() { return minimumOrderAmount; }
        public void setMinimumOrderAmount(Double minimumOrderAmount) { this.minimumOrderAmount = minimumOrderAmount; }
        public Double getMaxDeliveryDistance() { return maxDeliveryDistance; }
        public void setMaxDeliveryDistance(Double maxDeliveryDistance) { this.maxDeliveryDistance = maxDeliveryDistance; }
    }
}