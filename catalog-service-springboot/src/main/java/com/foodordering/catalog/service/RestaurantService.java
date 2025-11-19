package com.foodordering.catalog.service;

import com.foodordering.catalog.dto.RestaurantCreateDto;
import com.foodordering.catalog.dto.RestaurantResponseDto;
import com.foodordering.catalog.entity.Restaurant;
import com.foodordering.catalog.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    @Autowired
    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    // Create a new restaurant
    public RestaurantResponseDto createRestaurant(RestaurantCreateDto createDto) {
        Restaurant restaurant = mapToEntity(createDto);
        restaurant = restaurantRepository.save(restaurant);
        return mapToResponseDto(restaurant);
    }

    // Get all active restaurants
    public List<RestaurantResponseDto> getAllActiveRestaurants() {
        List<Restaurant> restaurants = restaurantRepository.findByIsActiveTrue();
        return restaurants.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // Get active restaurants with pagination
    public Page<RestaurantResponseDto> getActiveRestaurants(Pageable pageable) {
        Page<Restaurant> restaurants = restaurantRepository.findByIsActiveTrue(pageable);
        return restaurants.map(this::mapToResponseDto);
    }

    // Get restaurant by ID
    public Optional<RestaurantResponseDto> getRestaurantById(String id) {
        return restaurantRepository.findById(id)
                .map(this::mapToResponseDto);
    }

    // Update restaurant
    public Optional<RestaurantResponseDto> updateRestaurant(String id, RestaurantCreateDto updateDto) {
        return restaurantRepository.findById(id)
                .map(restaurant -> {
                    updateRestaurantFields(restaurant, updateDto);
                    restaurant.setUpdatedAt(LocalDateTime.now());
                    restaurant = restaurantRepository.save(restaurant);
                    return mapToResponseDto(restaurant);
                });
    }

    // Delete (deactivate) restaurant
    public boolean deleteRestaurant(String id) {
        return restaurantRepository.findById(id)
                .map(restaurant -> {
                    restaurant.setIsActive(false);
                    restaurant.setUpdatedAt(LocalDateTime.now());
                    restaurantRepository.save(restaurant);
                    return true;
                })
                .orElse(false);
    }

    // Search restaurants by name or description
    public List<RestaurantResponseDto> searchRestaurants(String searchTerm) {
        List<Restaurant> restaurants = restaurantRepository.searchByNameOrDescription(searchTerm);
        return restaurants.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // Get restaurants by cuisine type
    public List<RestaurantResponseDto> getRestaurantsByCuisine(String cuisineType) {
        List<Restaurant> restaurants = restaurantRepository.findByCuisineTypesContainingAndIsActiveTrue(cuisineType);
        return restaurants.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // Get restaurants by city
    public List<RestaurantResponseDto> getRestaurantsByCity(String city) {
        List<Restaurant> restaurants = restaurantRepository.findByAddressCityIgnoreCaseAndIsActiveTrue(city);
        return restaurants.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // Get restaurants by rating
    public List<RestaurantResponseDto> getRestaurantsByMinRating(Double minRating) {
        List<Restaurant> restaurants = restaurantRepository.findByRatingGreaterThanEqualAndIsActiveTrue(minRating);
        return restaurants.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // Get restaurants by multiple cuisine types
    public List<RestaurantResponseDto> getRestaurantsByCuisines(List<String> cuisineTypes) {
        List<Restaurant> restaurants = restaurantRepository.findByCuisineTypesIn(cuisineTypes);
        return restaurants.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // Private helper methods for mapping
    private Restaurant mapToEntity(RestaurantCreateDto dto) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(dto.getName());
        restaurant.setDescription(dto.getDescription());
        restaurant.setImageUrl(dto.getImageUrl());
        restaurant.setPhone(dto.getPhone());
        restaurant.setEmail(dto.getEmail());
        restaurant.setWebsite(dto.getWebsite());
        restaurant.setCuisineTypes(dto.getCuisineTypes());

        // Map address
        if (dto.getAddress() != null) {
            Restaurant.Address address = new Restaurant.Address();
            address.setStreet(dto.getAddress().getStreet());
            address.setCity(dto.getAddress().getCity());
            address.setState(dto.getAddress().getState());
            address.setZipCode(dto.getAddress().getZipCode());
            address.setCountry(dto.getAddress().getCountry());
            address.setLatitude(dto.getAddress().getLatitude());
            address.setLongitude(dto.getAddress().getLongitude());
            restaurant.setAddress(address);
        }

        // Map opening hours
        if (dto.getOpeningHours() != null) {
            Restaurant.OpeningHours openingHours = new Restaurant.OpeningHours();
            openingHours.setMonday(dto.getOpeningHours().getMonday());
            openingHours.setTuesday(dto.getOpeningHours().getTuesday());
            openingHours.setWednesday(dto.getOpeningHours().getWednesday());
            openingHours.setThursday(dto.getOpeningHours().getThursday());
            openingHours.setFriday(dto.getOpeningHours().getFriday());
            openingHours.setSaturday(dto.getOpeningHours().getSaturday());
            openingHours.setSunday(dto.getOpeningHours().getSunday());
            restaurant.setOpeningHours(openingHours);
        }

        // Map delivery info
        if (dto.getDeliveryInfo() != null) {
            Restaurant.DeliveryInfo deliveryInfo = new Restaurant.DeliveryInfo();
            deliveryInfo.setDeliveryTimeMinutes(dto.getDeliveryInfo().getDeliveryTimeMinutes());
            deliveryInfo.setDeliveryFee(dto.getDeliveryInfo().getDeliveryFee());
            deliveryInfo.setMinimumOrderAmount(dto.getDeliveryInfo().getMinimumOrderAmount());
            deliveryInfo.setMaxDeliveryDistance(dto.getDeliveryInfo().getMaxDeliveryDistance());
            restaurant.setDeliveryInfo(deliveryInfo);
        }

        return restaurant;
    }

    private RestaurantResponseDto mapToResponseDto(Restaurant restaurant) {
        RestaurantResponseDto dto = new RestaurantResponseDto();
        dto.setId(restaurant.getId());
        dto.setName(restaurant.getName());
        dto.setDescription(restaurant.getDescription());
        dto.setImageUrl(restaurant.getImageUrl());
        dto.setPhone(restaurant.getPhone());
        dto.setEmail(restaurant.getEmail());
        dto.setWebsite(restaurant.getWebsite());
        dto.setCuisineTypes(restaurant.getCuisineTypes());
        dto.setRating(restaurant.getRating());
        dto.setReviewCount(restaurant.getReviewCount());
        dto.setIsActive(restaurant.getIsActive());
        dto.setCreatedAt(restaurant.getCreatedAt());
        dto.setUpdatedAt(restaurant.getUpdatedAt());

        // Map address
        if (restaurant.getAddress() != null) {
            RestaurantResponseDto.AddressDto addressDto = new RestaurantResponseDto.AddressDto();
            addressDto.setStreet(restaurant.getAddress().getStreet());
            addressDto.setCity(restaurant.getAddress().getCity());
            addressDto.setState(restaurant.getAddress().getState());
            addressDto.setZipCode(restaurant.getAddress().getZipCode());
            addressDto.setCountry(restaurant.getAddress().getCountry());
            addressDto.setLatitude(restaurant.getAddress().getLatitude());
            addressDto.setLongitude(restaurant.getAddress().getLongitude());
            dto.setAddress(addressDto);
        }

        // Map opening hours
        if (restaurant.getOpeningHours() != null) {
            RestaurantResponseDto.OpeningHoursDto openingHoursDto = new RestaurantResponseDto.OpeningHoursDto();
            openingHoursDto.setMonday(restaurant.getOpeningHours().getMonday());
            openingHoursDto.setTuesday(restaurant.getOpeningHours().getTuesday());
            openingHoursDto.setWednesday(restaurant.getOpeningHours().getWednesday());
            openingHoursDto.setThursday(restaurant.getOpeningHours().getThursday());
            openingHoursDto.setFriday(restaurant.getOpeningHours().getFriday());
            openingHoursDto.setSaturday(restaurant.getOpeningHours().getSaturday());
            openingHoursDto.setSunday(restaurant.getOpeningHours().getSunday());
            dto.setOpeningHours(openingHoursDto);
        }

        // Map delivery info
        if (restaurant.getDeliveryInfo() != null) {
            RestaurantResponseDto.DeliveryInfoDto deliveryInfoDto = new RestaurantResponseDto.DeliveryInfoDto();
            deliveryInfoDto.setDeliveryTimeMinutes(restaurant.getDeliveryInfo().getDeliveryTimeMinutes());
            deliveryInfoDto.setDeliveryFee(restaurant.getDeliveryInfo().getDeliveryFee());
            deliveryInfoDto.setMinimumOrderAmount(restaurant.getDeliveryInfo().getMinimumOrderAmount());
            deliveryInfoDto.setMaxDeliveryDistance(restaurant.getDeliveryInfo().getMaxDeliveryDistance());
            dto.setDeliveryInfo(deliveryInfoDto);
        }

        return dto;
    }

    private void updateRestaurantFields(Restaurant restaurant, RestaurantCreateDto updateDto) {
        restaurant.setName(updateDto.getName());
        restaurant.setDescription(updateDto.getDescription());
        restaurant.setImageUrl(updateDto.getImageUrl());
        restaurant.setPhone(updateDto.getPhone());
        restaurant.setEmail(updateDto.getEmail());
        restaurant.setWebsite(updateDto.getWebsite());
        restaurant.setCuisineTypes(updateDto.getCuisineTypes());

        // Update address if provided
        if (updateDto.getAddress() != null) {
            Restaurant.Address address = restaurant.getAddress();
            if (address == null) {
                address = new Restaurant.Address();
            }
            address.setStreet(updateDto.getAddress().getStreet());
            address.setCity(updateDto.getAddress().getCity());
            address.setState(updateDto.getAddress().getState());
            address.setZipCode(updateDto.getAddress().getZipCode());
            address.setCountry(updateDto.getAddress().getCountry());
            address.setLatitude(updateDto.getAddress().getLatitude());
            address.setLongitude(updateDto.getAddress().getLongitude());
            restaurant.setAddress(address);
        }

        // Update opening hours if provided
        if (updateDto.getOpeningHours() != null) {
            Restaurant.OpeningHours openingHours = restaurant.getOpeningHours();
            if (openingHours == null) {
                openingHours = new Restaurant.OpeningHours();
            }
            openingHours.setMonday(updateDto.getOpeningHours().getMonday());
            openingHours.setTuesday(updateDto.getOpeningHours().getTuesday());
            openingHours.setWednesday(updateDto.getOpeningHours().getWednesday());
            openingHours.setThursday(updateDto.getOpeningHours().getThursday());
            openingHours.setFriday(updateDto.getOpeningHours().getFriday());
            openingHours.setSaturday(updateDto.getOpeningHours().getSaturday());
            openingHours.setSunday(updateDto.getOpeningHours().getSunday());
            restaurant.setOpeningHours(openingHours);
        }

        // Update delivery info if provided
        if (updateDto.getDeliveryInfo() != null) {
            Restaurant.DeliveryInfo deliveryInfo = restaurant.getDeliveryInfo();
            if (deliveryInfo == null) {
                deliveryInfo = new Restaurant.DeliveryInfo();
            }
            deliveryInfo.setDeliveryTimeMinutes(updateDto.getDeliveryInfo().getDeliveryTimeMinutes());
            deliveryInfo.setDeliveryFee(updateDto.getDeliveryInfo().getDeliveryFee());
            deliveryInfo.setMinimumOrderAmount(updateDto.getDeliveryInfo().getMinimumOrderAmount());
            deliveryInfo.setMaxDeliveryDistance(updateDto.getDeliveryInfo().getMaxDeliveryDistance());
            restaurant.setDeliveryInfo(deliveryInfo);
        }
    }
}