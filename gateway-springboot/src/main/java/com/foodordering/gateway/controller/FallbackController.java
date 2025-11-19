package com.foodordering.gateway.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    private static final String ERROR_KEY = "error";
    private static final String MESSAGE_KEY = "message";
    private static final String STATUS_KEY = "status";
    private static final String DEFAULT_MESSAGE = "Please try again later";
    private static final String STATUS_503 = "503";

    @GetMapping("/user-service")
    public Mono<ResponseEntity<Map<String, String>>> userServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        ERROR_KEY, "User Service is currently unavailable",
                        MESSAGE_KEY, DEFAULT_MESSAGE,
                        STATUS_KEY, STATUS_503
                )));
    }

    @GetMapping("/catalog-service")
    public Mono<ResponseEntity<Map<String, String>>> catalogServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        ERROR_KEY, "Catalog Service is currently unavailable",
                        MESSAGE_KEY, DEFAULT_MESSAGE,
                        STATUS_KEY, STATUS_503
                )));
    }

    @GetMapping("/order-service")
    public Mono<ResponseEntity<Map<String, String>>> orderServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        ERROR_KEY, "Order Service is currently unavailable",
                        MESSAGE_KEY, DEFAULT_MESSAGE,
                        STATUS_KEY, STATUS_503
                )));
    }

    @GetMapping("/payment-service")
    public Mono<ResponseEntity<Map<String, String>>> paymentServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        ERROR_KEY, "Payment Service is currently unavailable",
                        MESSAGE_KEY, DEFAULT_MESSAGE,
                        STATUS_KEY, STATUS_503
                )));
    }

    @GetMapping("/delivery-service")
    public Mono<ResponseEntity<Map<String, String>>> deliveryServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        ERROR_KEY, "Delivery Service is currently unavailable",
                        MESSAGE_KEY, DEFAULT_MESSAGE,
                        STATUS_KEY, STATUS_503
                )));
    }
}