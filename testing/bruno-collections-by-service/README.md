# Bruno Collections by Service

This directory contains separate Bruno collections for each microservice in the G10 Food Ordering system.

## Directory Structure

```
bruno-collections-by-service/
├── user-service/
│   ├── bruno.json
│   ├── 01-health-check.bru
│   ├── 02-user-registration.bru
│   ├── 03-user-login.bru
│   ├── 04-get-user-profile.bru
│   ├── 05-update-user-profile.bru
│   ├── 06-user-logout.bru
│   └── 07-deactivate-account.bru
├── catalog-service/
│   ├── bruno.json
│   ├── 01-health-check.bru
│   ├── 02-create-restaurant.bru
│   ├── 03-get-restaurants.bru
│   ├── 04-get-restaurant-by-id.bru
│   ├── 05-search-restaurants.bru
│   └── 06-get-restaurants-by-cuisine.bru
├── order-service/
│   ├── bruno.json
│   ├── 01-health-check.bru
│   ├── 02-create-order.bru
│   ├── 03-get-all-orders.bru
│   ├── 04-get-order-by-id.bru
│   └── 05-update-order-status.bru
├── payment-service/
│   ├── bruno.json
│   ├── 01-health-check.bru
│   ├── 02-process-payment.bru
│   ├── 03-get-payment-status.bru
│   ├── 04-get-payment-methods.bru
│   └── 05-process-refund.bru
└── delivery-service/
    ├── bruno.json
    ├── 01-health-check.bru
    ├── 02-assign-delivery.bru
    ├── 03-track-delivery.bru
    ├── 04-get-available-drivers.bru
    └── 05-update-delivery-status.bru
```

## Service Details

### 1. User Service (Port 8081)
**Base URL:** `http://localhost:8081`

**Endpoints:**
- `GET /api/users/health` - Health check
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `POST /api/users/logout` - User logout (requires auth)
- `DELETE /api/users/profile` - Deactivate account (requires auth)

### 2. Catalog Service (Port 8082)
**Base URL:** `http://localhost:8082`

**Endpoints:**
- `GET /api/restaurants/health` - Health check
- `POST /api/restaurants` - Create restaurant (requires auth)
- `GET /api/restaurants` - Get all restaurants (with pagination)
- `GET /api/restaurants/{id}` - Get restaurant by ID
- `GET /api/restaurants/search` - Search restaurants
- `GET /api/restaurants/cuisine/{cuisineType}` - Get restaurants by cuisine

### 3. Order Service (Port 8083)
**Base URL:** `http://localhost:8083`

**Endpoints:**
- `GET /api/orders/health` - Health check
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order by ID
- `PUT /api/orders/{id}/status` - Update order status

### 4. Payment Service (Port 8084)
**Base URL:** `http://localhost:8084`

**Endpoints:**
- `GET /api/payments/health` - Health check
- `POST /api/payments/process` - Process payment (requires auth)
- `GET /api/payments/status/{transactionId}` - Get payment status (requires auth)
- `GET /api/payments/methods` - Get available payment methods
- `POST /api/payments/refund/{transactionId}` - Process refund (requires auth)

### 5. Delivery Service (Port 8085)
**Base URL:** `http://localhost:8085`

**Endpoints:**
- `GET /api/delivery/health` - Health check
- `POST /api/delivery/assign` - Assign delivery to driver (requires auth)
- `GET /api/delivery/track/{deliveryId}` - Track delivery
- `GET /api/delivery/drivers/available` - Get available drivers (requires auth)
- `PUT /api/delivery/status/{deliveryId}` - Update delivery status (requires auth)

## How to Use

1. **Open Bruno** and import each collection separately
2. **Select Environment** - Choose "Local Development" for local testing
3. **Authentication Flow:**
   - Start with User Service registration/login to get auth token
   - Token is automatically saved in environment variables for other requests

## Environment Variables

Each collection includes these environment variables:
- `baseUrl` - Service base URL
- `authToken` - JWT token (set automatically after login)
- Service-specific variables (orderId, restaurantId, etc.)

## Testing Flow Suggestions

### Complete End-to-End Flow:
1. **User Service:** Register → Login (saves token)
2. **Catalog Service:** Create Restaurant → Get Restaurants
3. **Order Service:** Create Order → Get Order
4. **Payment Service:** Process Payment
5. **Delivery Service:** Assign Delivery → Track Delivery

### Individual Service Testing:
Each collection can be used independently to test specific service functionality.

## Benefits of Separate Collections

- **Focused Testing:** Test individual services in isolation
- **Team Collaboration:** Different teams can work with their specific service collections
- **Easier Maintenance:** Updates to one service don't affect other collections
- **Better Organization:** Clear separation of concerns
- **Independent Deployment Testing:** Test services as they are deployed individually