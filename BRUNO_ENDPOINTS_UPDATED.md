# ✅ **UPDATED BRUNO API COLLECTIONS - SPRING BOOT ENDPOINTS**

## 🎯 **Summary of Updates**

I have successfully updated all Bruno API collections to match the deployed **100% Spring Boot microservices** architecture. Here's what was changed:

### **🔄 Environment Configuration Updates**

**File**: `environments/Local Development.bru`

**BEFORE** (Old Node.js ports):
```
gatewayUrl: http://localhost:3000
userServiceUrl: http://localhost:3001
catalogServiceUrl: http://localhost:3002
orderServiceUrl: http://localhost:3003
paymentServiceUrl: http://localhost:3004
deliveryServiceUrl: http://localhost:3005
```

**AFTER** (New Spring Boot ports):
```
gatewayUrl: http://localhost:8080
userServiceUrl: http://localhost:8081
catalogServiceUrl: http://localhost:8082
orderServiceUrl: http://localhost:8083
paymentServiceUrl: http://localhost:8084
deliveryServiceUrl: http://localhost:8085
```

---

## 📁 **Updated Bruno Collections**

### **1. Health Checks** - `01-health-checks-all.bru`
✅ **Status**: Ready  
🎯 **Endpoints**: Spring Boot Actuator `/actuator/health`  
🔍 **Tests**: Validates all services return `{ "status": "UP" }`

### **2. User Registration** - `02-user-registration.bru`
✅ **Status**: Updated  
🎯 **Endpoint**: `POST /api/users/register`  
📝 **Request Body**:
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!",
  "name": "Test User",
  "phone": "+1234567890",
  "role": "CUSTOMER"
}
```
🔍 **Tests**: Validates JWT token response and saves `authToken`

### **3. User Login** - `03-user-login.bru`
✅ **Status**: Updated  
🎯 **Endpoint**: `POST /api/users/login`  
📝 **Request Body**:
```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123!"
}
```
🔍 **Tests**: Validates JWT token format and saves for subsequent requests

### **4. User Profile** - `04-user-profile.bru`
✅ **Status**: Updated  
🎯 **Endpoint**: `GET /api/users/profile`  
🔐 **Auth**: Bearer token required  
🔍 **Tests**: Validates profile data (`name`, `role`, `email`)

### **5. Create Restaurant** - `05-create-restaurant.bru`
✅ **Status**: Updated  
🎯 **Endpoint**: `POST /api/restaurants`  
📝 **Request Body**:
```json
{
  "name": "Test Pizza Palace",
  "description": "Authentic Italian pizzas and pasta",
  "cuisineTypes": ["Italian", "Pizza"],
  "address": {
    "street": "123 Pizza Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "latitude": 40.7128,
    "longitude": -74.006
  },
  "phone": "+15559999",
  "email": "info@testpizzapalace.com",
  "website": "https://testpizzapalace.com"
}
```
🔍 **Tests**: Saves `restaurantId` for subsequent tests

### **6. Get Restaurants** - `05-get-restaurants.bru`
✅ **Status**: Ready  
🎯 **Endpoint**: `GET /api/restaurants`  
🔍 **Tests**: Validates paginated response with `content` array

### **7. Create Order** - `07-create-order.bru`
✅ **Status**: Updated + Enhanced  
🎯 **Endpoint**: `POST /api/orders` (**NEW endpoint added to OrderController**)  
📝 **Request Body**:
```json
{
  "userId": "{{userId}}",
  "restaurantId": "{{restaurantId}}",
  "totalAmount": 34.48,
  "deliveryFee": 2.99,
  "taxAmount": 2.76,
  "deliveryAddress": {
    "street": "123 Test Street",
    "city": "Test City",
    "state": "TS",
    "zipCode": "12345",
    "country": "USA",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "specialInstructions": "Ring the doorbell twice"
}
```
🔍 **Tests**: Validates order creation with `PENDING` status and saves `orderId`

### **8. Gateway Routing Tests** - `11-gateway-routing.bru`
✅ **Status**: Updated  
🎯 **Endpoints**: 
- `GET /api/users/profile` (routes to User Service)
- `GET /api/restaurants` (routes to Catalog Service)
- `GET /api/orders` (routes to Order Service)

🔍 **Tests**: Validates Spring Cloud Gateway routing functionality

---

## 🔧 **Backend Code Updates**

### **OrderController Enhancement**
**File**: `order-service-springboot/src/main/java/com/foodordering/order/controller/OrderController.java`

**Added POST endpoint**:
```java
@PostMapping
public ResponseEntity<Order> createOrder(@RequestBody Order order) {
    order.setCreatedAt(LocalDateTime.now());
    order.setUpdatedAt(LocalDateTime.now());
    Order savedOrder = orderRepository.save(order);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
}
```

### **Gateway Configuration Update**
**File**: `gateway-springboot/src/main/java/com/foodordering/gateway/config/GatewayConfig.java`

**Updated service URIs**:
```java
.route("user-service", r -> r.path("/api/users/**")
        .uri("http://user-service:8080"))
.route("catalog-service", r -> r.path("/api/restaurants/**", "/api/catalog/**")
        .uri("http://catalog-service:8080"))
.route("order-service", r -> r.path("/api/orders/**")
        .uri("http://order-service:8080"))
.route("payment-service", r -> r.path("/api/payments/**")
        .uri("http://payment-service:8080"))
.route("delivery-service", r -> r.path("/api/deliveries/**")
        .uri("http://delivery-service:8080"))
```

---

## 🧪 **Testing Instructions**

### **1. Open Bruno API Client**
```bash
cd /Users/I528972/Documents/g10-food-ordering/testing/bruno-collections
bruno .
```

### **2. Select Environment**
- In Bruno, select **"Local Development"** environment
- Verify all URLs point to ports 8080-8085

### **3. Run Tests in Order**
1. **Health Checks** → Verify all services are UP
2. **User Registration** → Creates user and gets JWT token
3. **User Login** → Validates authentication
4. **User Profile** → Tests authenticated endpoint
5. **Create Restaurant** → Creates test restaurant
6. **Get Restaurants** → Lists restaurants with pagination
7. **Create Order** → Creates order with Spring Boot JPA entities
8. **Gateway Routing** → Tests Spring Cloud Gateway functionality

### **4. Expected Results**
✅ All tests should pass with Spring Boot responses  
✅ JWT tokens automatically saved between requests  
✅ Gateway routing works seamlessly  
✅ Database operations use proper JPA/MongoDB entities  
✅ Health checks return Spring Boot Actuator format  

---

## 🎯 **Key Achievements**

✅ **Complete Port Migration**: 3000-3005 → 8080-8085  
✅ **Spring Boot DTOs**: All requests match actual entity structures  
✅ **JWT Authentication**: Proper Spring Security integration  
✅ **Database Integration**: JPA (PostgreSQL) + MongoDB entities  
✅ **Gateway Routing**: Spring Cloud Gateway configuration  
✅ **Health Monitoring**: Spring Boot Actuator endpoints  
✅ **API Testing**: Comprehensive Bruno collection ready  

---

## 🚀 **System Status**

**All 6 Spring Boot Services Running:**
- **Gateway**: http://localhost:8080 ✅
- **User Service**: http://localhost:8081 ✅  
- **Catalog Service**: http://localhost:8082 ✅
- **Order Service**: http://localhost:8083 ✅
- **Payment Service**: http://localhost:8084 ✅
- **Delivery Service**: http://localhost:8085 ✅

**Infrastructure Services:**
- **PostgreSQL**: localhost:5432 ✅
- **MongoDB**: localhost:27017 ✅
- **RabbitMQ**: localhost:5672 (UI: 15672) ✅
- **Redis**: localhost:6379 ✅

**Bruno API Collections:** ✅ **Ready for Testing**

Your **100% Spring Boot food ordering system** is now fully deployed with updated Bruno API collections that match the actual service implementations! 🎉