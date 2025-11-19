package com.foodordering.payment.controller;

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

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Payment Processing", description = "APIs for handling payment transactions, refunds, and payment methods")
public class PaymentController {

    @PostMapping("/process")
    @Operation(
        summary = "Process payment for an order",
        description = "Process payment transaction for a food order using various payment methods"
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Payment processed successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid payment data"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "402", description = "Payment failed"),
        @ApiResponse(responseCode = "409", description = "Payment already processed")
    })
    public ResponseEntity<Map<String, Object>> processPayment(
            @Parameter(description = "Payment details", required = true)
            @Valid @RequestBody Map<String, Object> paymentRequest) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Simulate payment processing
            String orderId = (String) paymentRequest.get("orderId");
            Double amount = (Double) paymentRequest.get("amount");
            String paymentMethod = (String) paymentRequest.get("paymentMethod");

            // Mock payment processing logic
            String transactionId = "TXN_" + System.currentTimeMillis();

            response.put("success", true);
            response.put("transactionId", transactionId);
            response.put("orderId", orderId);
            response.put("amount", amount);
            response.put("paymentMethod", paymentMethod);
            response.put("status", "COMPLETED");
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("message", "Payment processed successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Payment processing failed: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());

            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
        }
    }

    @GetMapping("/status/{transactionId}")
    @Operation(
        summary = "Get payment status",
        description = "Retrieve the status of a payment transaction"
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Payment status retrieved",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "404", description = "Transaction not found"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<Map<String, Object>> getPaymentStatus(
            @Parameter(description = "Transaction ID", required = true)
            @PathVariable String transactionId) {

        Map<String, Object> response = new HashMap<>();
        response.put("transactionId", transactionId);
        response.put("status", "COMPLETED");
        response.put("amount", 25.99);
        response.put("paymentMethod", "CREDIT_CARD");
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refund/{transactionId}")
    @Operation(
        summary = "Process refund",
        description = "Process a refund for a completed payment transaction"
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Refund processed successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid refund request"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "404", description = "Transaction not found"),
        @ApiResponse(responseCode = "409", description = "Refund not allowed")
    })
    public ResponseEntity<Map<String, Object>> processRefund(
            @Parameter(description = "Transaction ID", required = true)
            @PathVariable String transactionId,
            @Parameter(description = "Refund details", required = true)
            @Valid @RequestBody Map<String, Object> refundRequest) {

        Map<String, Object> response = new HashMap<>();

        try {
            Double refundAmount = (Double) refundRequest.get("amount");
            String reason = (String) refundRequest.get("reason");

            String refundId = "REF_" + System.currentTimeMillis();

            response.put("success", true);
            response.put("refundId", refundId);
            response.put("transactionId", transactionId);
            response.put("refundAmount", refundAmount);
            response.put("reason", reason);
            response.put("status", "REFUNDED");
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("message", "Refund processed successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Refund processing failed: " + e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/methods")
    @Operation(
        summary = "Get available payment methods",
        description = "Retrieve list of available payment methods"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Payment methods retrieved",
            content = @Content(schema = @Schema(implementation = Map.class))
        )
    })
    public ResponseEntity<Map<String, Object>> getPaymentMethods() {
        Map<String, Object> response = new HashMap<>();
        response.put("paymentMethods", new String[]{
            "CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "APPLE_PAY", "GOOGLE_PAY", "CASH_ON_DELIVERY"
        });
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    @Operation(
        summary = "Health check",
        description = "Check if the payment service is running properly"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service is healthy")
    })
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "payment-service",
                "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }
}
