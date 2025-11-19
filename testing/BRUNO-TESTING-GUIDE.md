# 🧪 Bruno API Testing Collections - Spring Boot Edition

## 📋 Overview
Complete Bruno API testing collections for the G10 Food Ordering Spring Boot microservices architecture. All endpoints updated for Spring Boot ports (8080-8085) and entity structures.

## 🗂️ Test Collections Structure

### 📁 bruno-collections/
```
├── bruno.json                     # Main collection configuration
├── environments/
│   └── Local Development.bru      # Environment variables
└── Test Files:
    ├── 01-health-checks-all.bru           # Spring Boot Actuator health checks
    ├── 02-user-registration.bru           # User Service registration
    ├── 03-user-login.bru                  # JWT authentication
    ├── 04-user-profile.bru                # User profile management
    ├── 05-get-restaurants.bru             # Catalog Service - Get restaurants
    ├── 05-create-restaurant.bru           # Catalog Service - Create restaurant
    ├── 07-create-order.bru                # Order Service - Create order
    ├── 08-get-order-details.bru           # Order Service - Get order details
    ├── 09-process-payment.bru             # Payment Service - Process payment
    ├── 10-delivery-tracking.bru           # Delivery Service - Track delivery
    ├── 11-gateway-routing.bru             # Spring Cloud Gateway routing
    └── 12-error-handling.bru              # Error handling validation
```

## 🎯 Environment Configuration

### Local Development Environment
```json
{
  "baseUrl": "http://localhost:8080",
  "gatewayUrl": "http://localhost:8080",           // Spring Cloud Gateway
  "userServiceUrl": "http://localhost:8081",       // User Service
  "catalogServiceUrl": "http://localhost:8082",    // Catalog Service  
  "orderServiceUrl": "http://localhost:8083",      // Order Service
  "paymentServiceUrl": "http://localhost:8084",    // Payment Service
  "deliveryServiceUrl": "http://localhost:8085",   // Delivery Service
  "authToken": ""                                   // JWT token (auto-populated)
}
```

## 🚀 Quick Start

### 1. Setup Bruno
```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Or use Bruno Desktop App
# Download from: https://www.usebruno.com/
```

### 2. Start Spring Boot Services
```bash
# Start all services
./start-springboot-services.sh

# Validate setup
./validate-springboot-setup.sh
```

### 3. Run Tests

#### Option A: Using Bruno Desktop App
1. Open Bruno Desktop App
2. Open Collection: `testing/bruno-collections/`
3. Select Environment: "Local Development (Spring Boot)"
4. Run tests in sequence (1 → 12)

#### Option B: Using Bruno CLI
```bash
# Run all tests automatically
./testing/run-spring-boot-tests.sh

# Run individual test
cd testing/bruno-collections
bru run 01-health-checks-all.bru --env local
```

#### Option C: Manual Testing Sequence
```bash
# 1. Health Checks
bru run 01-health-checks-all.bru --env local

# 2. User Registration & Authentication
bru run 02-user-registration.bru --env local
bru run 03-user-login.bru --env local          # JWT token auto-saved
bru run 04-user-profile.bru --env local

# 3. Restaurant Management
bru run 05-get-restaurants.bru --env local
bru run 05-create-restaurant.bru --env local

# 4. Order Processing
bru run 07-create-order.bru --env local
bru run 08-get-order-details.bru --env local

# 5. Payment Processing
bru run 09-process-payment.bru --env local

# 6. Delivery Tracking
bru run 10-delivery-tracking.bru --env local

# 7. Gateway Routing
bru run 11-gateway-routing.bru --env local

# 8. Error Handling
bru run 12-error-handling.bru --env local
```

## 📊 Test Coverage

### ✅ Spring Boot Features Tested
- **Spring Boot Actuator**: Health checks for all services
- **Spring Security + JWT**: Authentication and authorization
- **Spring Data JPA**: Order entity with PostgreSQL
- **Spring Data MongoDB**: User, Catalog, Delivery entities
- **Spring Cloud Gateway**: Routing and circuit breakers
- **Spring Validation**: Input validation and error handling
- **Spring WebSocket**: Real-time delivery tracking
- **Spring Boot gRPC**: Payment service integration

### 🎯 API Endpoints Covered
- **User Service** (8081): Registration, Login, Profile Management
- **Catalog Service** (8082): Restaurant and Menu Management
- **Order Service** (8083): Order Creation, Retrieval, CQRS
- **Payment Service** (8084): Payment Processing, gRPC
- **Delivery Service** (8085): Delivery Tracking, WebSocket
- **Gateway Service** (8080): Routing, Circuit Breakers

### 🧪 Test Scenarios
- **Happy Path**: Complete user journey from registration to delivery
- **Authentication**: JWT token generation and validation
- **Data Validation**: Input validation and error responses
- **Gateway Routing**: Spring Cloud Gateway functionality
- **Error Handling**: 400, 401, 404, 500 error responses
- **Circuit Breakers**: Fallback handling for failed services

## 📈 Expected Results

### Successful Test Run:
```
🧪 G10 Food Ordering - Spring Boot API Test Suite
==================================================
✅ PASSED: 01-health-checks-all.bru
✅ PASSED: 02-user-registration.bru
✅ PASSED: 03-user-login.bru
✅ PASSED: 04-user-profile.bru
✅ PASSED: 05-get-restaurants.bru
✅ PASSED: 05-create-restaurant.bru
✅ PASSED: 07-create-order.bru
✅ PASSED: 08-get-order-details.bru
✅ PASSED: 09-process-payment.bru
✅ PASSED: 10-delivery-tracking.bru
✅ PASSED: 11-gateway-routing.bru
✅ PASSED: 12-error-handling.bru

📊 Test Summary:
✅ Passed: 12
❌ Failed: 0
📈 Success Rate: 100%

🎉 All tests passed! Spring Boot API is working correctly.
```

## 🔧 Troubleshooting

### Common Issues:

1. **Services Not Running**
   ```bash
   # Check if all services are up
   curl http://localhost:8081/actuator/health
   # If not, restart services
   ./start-springboot-services.sh
   ```

2. **JWT Token Expired**
   ```bash
   # Re-run login test to get fresh token
   bru run 03-user-login.bru --env local
   ```

3. **Database Connection Issues**
   ```bash
   # Check Docker containers
   docker ps
   # Restart infrastructure if needed
   cd dev-infra && docker-compose restart
   ```

## 🎉 Success Criteria

- ✅ All 6 Spring Boot services responding on correct ports
- ✅ Spring Boot Actuator health checks return "UP" status
- ✅ JWT authentication working across all protected endpoints
- ✅ CRUD operations functioning for all entities
- ✅ Spring Cloud Gateway routing requests correctly
- ✅ Error handling returning appropriate HTTP status codes
- ✅ Complete user journey from registration to delivery tracking

**Your Spring Boot microservices API is ready for production! 🚀**