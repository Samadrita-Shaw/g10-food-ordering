package com.foodordering.gateway.controller;

import java.util.Map;
import java.util.HashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    private static final String ERROR_KEY = "error";
    private static final String MESSAGE_KEY = "message";
    private static final String STATUS_KEY = "status";
    private static final String SERVICE_KEY = "service";
    private static final String TIMESTAMP_KEY = "timestamp";
    private static final String DEFAULT_MESSAGE = "Service is temporarily unavailable. Please try again later";
    private static final String STATUS_503 = "503";

    @GetMapping("/user-service")
    public Mono<ResponseEntity<Map<String, String>>> userServiceFallback() {
        return createFallbackResponse("User Service");
    }

    @PostMapping("/user-service")
    public Mono<ResponseEntity<Map<String, String>>> userServiceFallbackPost() {
        return createFallbackResponse("User Service");
    }

    @PutMapping("/user-service")
    public Mono<ResponseEntity<Map<String, String>>> userServiceFallbackPut() {
        return createFallbackResponse("User Service");
    }

    @DeleteMapping("/user-service")
    public Mono<ResponseEntity<Map<String, String>>> userServiceFallbackDelete() {
        return createFallbackResponse("User Service");
    }

    @GetMapping("/catalog-service")
    public Mono<ResponseEntity<Map<String, String>>> catalogServiceFallback() {
        return createFallbackResponse("Catalog Service");
    }

    @PostMapping("/catalog-service")
    public Mono<ResponseEntity<Map<String, String>>> catalogServiceFallbackPost() {
        return createFallbackResponse("Catalog Service");
    }

    @PutMapping("/catalog-service")
    public Mono<ResponseEntity<Map<String, String>>> catalogServiceFallbackPut() {
        return createFallbackResponse("Catalog Service");
    }

    @DeleteMapping("/catalog-service")
    public Mono<ResponseEntity<Map<String, String>>> catalogServiceFallbackDelete() {
        return createFallbackResponse("Catalog Service");
    }

    @GetMapping("/order-service")
    public Mono<ResponseEntity<Map<String, String>>> orderServiceFallback() {
        return createFallbackResponse("Order Service");
    }

    @PostMapping("/order-service")
    public Mono<ResponseEntity<Map<String, String>>> orderServiceFallbackPost() {
        return createFallbackResponse("Order Service");
    }

    @PutMapping("/order-service")
    public Mono<ResponseEntity<Map<String, String>>> orderServiceFallbackPut() {
        return createFallbackResponse("Order Service");
    }

    @DeleteMapping("/order-service")
    public Mono<ResponseEntity<Map<String, String>>> orderServiceFallbackDelete() {
        return createFallbackResponse("Order Service");
    }

    @GetMapping("/payment-service")
    public Mono<ResponseEntity<Map<String, String>>> paymentServiceFallback() {
        return createFallbackResponse("Payment Service");
    }

    @PostMapping("/payment-service")
    public Mono<ResponseEntity<Map<String, String>>> paymentServiceFallbackPost() {
        return createFallbackResponse("Payment Service");
    }

    @PutMapping("/payment-service")
    public Mono<ResponseEntity<Map<String, String>>> paymentServiceFallbackPut() {
        return createFallbackResponse("Payment Service");
    }

    @DeleteMapping("/payment-service")
    public Mono<ResponseEntity<Map<String, String>>> paymentServiceFallbackDelete() {
        return createFallbackResponse("Payment Service");
    }

    @GetMapping("/delivery-service")
    public Mono<ResponseEntity<Map<String, String>>> deliveryServiceFallback() {
        return createFallbackResponse("Delivery Service");
    }

    @PostMapping("/delivery-service")
    public Mono<ResponseEntity<Map<String, String>>> deliveryServiceFallbackPost() {
        return createFallbackResponse("Delivery Service");
    }

    @PutMapping("/delivery-service")
    public Mono<ResponseEntity<Map<String, String>>> deliveryServiceFallbackPut() {
        return createFallbackResponse("Delivery Service");
    }

    @DeleteMapping("/delivery-service")
    public Mono<ResponseEntity<Map<String, String>>> deliveryServiceFallbackDelete() {
        return createFallbackResponse("Delivery Service");
    }

    // Gateway health check
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, String>>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "gateway-service");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        response.put("message", "Gateway is running");
        
        return Mono.just(ResponseEntity.ok(response));
    }

    private Mono<ResponseEntity<Map<String, String>>> createFallbackResponse(String serviceName) {
        Map<String, String> response = new HashMap<>();
        response.put(ERROR_KEY, serviceName + " is currently unavailable");
        response.put(MESSAGE_KEY, DEFAULT_MESSAGE);
        response.put(STATUS_KEY, STATUS_503);
        response.put(SERVICE_KEY, serviceName);
        response.put(TIMESTAMP_KEY, String.valueOf(System.currentTimeMillis()));
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }
}