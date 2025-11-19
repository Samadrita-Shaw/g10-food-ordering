package com.foodordering.delivery.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Arrays;

@RestController
@RequestMapping("/api/delivery")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Delivery Management", description = "APIs for managing food delivery operations, tracking, and driver assignment")
public class DeliveryController {

    @PostMapping("/assign")
    @Operation(
        summary = "Assign delivery to driver",
        description = "Assign a food delivery order to an available driver"
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Delivery assigned successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid delivery assignment data"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "404", description = "Order or driver not found"),
        @ApiResponse(responseCode = "409", description = "Order already assigned")
    })
    public ResponseEntity<Map<String, Object>> assignDelivery(
            @Parameter(description = "Delivery assignment details", required = true)
            @Valid @RequestBody Map<String, Object> assignmentRequest) {

        Map<String, Object> response = new HashMap<>();

        try {
            String orderId = (String) assignmentRequest.get("orderId");
            String driverId = (String) assignmentRequest.get("driverId");

            // Mock delivery assignment logic
            String deliveryId = "DEL_" + System.currentTimeMillis();

            response.put("success", true);
            response.put("deliveryId", deliveryId);
            response.put("orderId", orderId);
            response.put("driverId", driverId);
            response.put("status", "ASSIGNED");
            response.put("estimatedDeliveryTime", LocalDateTime.now().plusMinutes(30).toString());
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("message", "Delivery assigned successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Delivery assignment failed: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/track/{deliveryId}")
    @Operation(
        summary = "Track delivery status",
        description = "Get real-time tracking information for a delivery"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Delivery tracking information retrieved",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "404", description = "Delivery not found")
    })
    public ResponseEntity<Map<String, Object>> trackDelivery(
            @Parameter(description = "Delivery ID", required = true)
            @PathVariable String deliveryId) {

        Map<String, Object> response = new HashMap<>();
        response.put("deliveryId", deliveryId);
        response.put("status", "ON_THE_WAY");
        response.put("currentLocation", Map.of(
            "latitude", 37.7749,
            "longitude", -122.4194,
            "address", "123 Main St, San Francisco, CA"
        ));
        response.put("estimatedDeliveryTime", LocalDateTime.now().plusMinutes(15).toString());
        response.put("driverName", "John Doe");
        response.put("driverPhone", "+1-555-0123");
        response.put("lastUpdate", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/status/{deliveryId}")
    @Operation(
        summary = "Update delivery status",
        description = "Update the status of a delivery (for drivers and system)"
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Delivery status updated successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid status update"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "404", description = "Delivery not found")
    })
    public ResponseEntity<Map<String, Object>> updateDeliveryStatus(
            @Parameter(description = "Delivery ID", required = true)
            @PathVariable String deliveryId,
            @Parameter(description = "Status update details", required = true)
            @Valid @RequestBody Map<String, Object> statusUpdate) {

        Map<String, Object> response = new HashMap<>();

        try {
            String newStatus = (String) statusUpdate.get("status");
            String location = (String) statusUpdate.getOrDefault("location", "");
            String notes = (String) statusUpdate.getOrDefault("notes", "");

            response.put("success", true);
            response.put("deliveryId", deliveryId);
            response.put("status", newStatus);
            response.put("location", location);
            response.put("notes", notes);
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("message", "Delivery status updated successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Status update failed: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/drivers/available")
    @Operation(
        summary = "Get available drivers",
        description = "Retrieve list of drivers available for delivery assignment"
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Available drivers retrieved",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<Map<String, Object>> getAvailableDrivers() {
        Map<String, Object> response = new HashMap<>();

        List<Map<String, Object>> drivers = Arrays.asList(
            Map.of(
                "driverId", "DR001",
                "name", "John Doe",
                "rating", 4.8,
                "currentLocation", Map.of("latitude", 37.7749, "longitude", -122.4194),
                "vehicle", "Bike"
            ),
            Map.of(
                "driverId", "DR002",
                "name", "Jane Smith",
                "rating", 4.9,
                "currentLocation", Map.of("latitude", 37.7849, "longitude", -122.4094),
                "vehicle", "Car"
            )
        );

        response.put("availableDrivers", drivers);
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{orderId}/delivery")
    @Operation(
        summary = "Get delivery details for order",
        description = "Retrieve delivery information for a specific order"
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Order delivery details retrieved",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "404", description = "Order or delivery not found"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<Map<String, Object>> getOrderDeliveryDetails(
            @Parameter(description = "Order ID", required = true)
            @PathVariable String orderId) {

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        response.put("deliveryId", "DEL_" + orderId);
        response.put("status", "DELIVERED");
        response.put("assignedDriver", Map.of(
            "driverId", "DR001",
            "name", "John Doe",
            "phone", "+1-555-0123"
        ));
        response.put("deliveryAddress", Map.of(
            "street", "456 Oak St",
            "city", "San Francisco",
            "state", "CA",
            "zipCode", "94102"
        ));
        response.put("deliveredAt", LocalDateTime.now().minusHours(1).toString());
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    @Operation(
        summary = "Health check",
        description = "Check if the delivery service is running properly"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service is healthy")
    })
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "delivery-service",
                "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }
}
