# Food Ordering Microservices - API Documentation

## Overview
This document provides comprehensive API documentation for all microservices in the Food Ordering platform.

## Service Endpoints

### API Gateway (Port 3000)
**Base URL**: `http://localhost:3000`

#### GraphQL Endpoint
- **URL**: `/graphql`
- **Method**: POST
- **Description**: GraphQL playground for flexible data fetching

#### Health Check
- **URL**: `/health`
- **Method**: GET
- **Response**: 
```json
{
  "status": "OK",
  "timestamp": "2025-10-25T10:00:00Z"
}
```

---

## User Service (Port 3001)

### Authentication Endpoints

#### Register User
- **URL**: `/api/users/register`
- **Method**: POST
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```
- **Response**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  },
  "token": "jwt_token"
}
```

#### Login
- **URL**: `/api/users/login`
- **Method**: POST
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
- **URL**: `/api/users/profile`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`

#### Update Profile
- **URL**: `/api/users/profile`
- **Method**: PUT
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "name": "Updated Name",
  "preferences": {
    "cuisine": ["italian", "chinese"],
    "dietaryRestrictions": ["vegetarian"]
  }
}
```

### Address Management

#### Add Address
- **URL**: `/api/users/addresses`
- **Method**: POST
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "type": "home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

---

## Catalog Service (Port 3002)

### Restaurant Endpoints

#### Get All Restaurants
- **URL**: `/api/catalog/restaurants`
- **Method**: GET
- **Query Parameters**:
  - `cuisine`: Filter by cuisine type
  - `rating`: Minimum rating
  - `location`: Filter by location
- **Response**:
```json
[
  {
    "id": "restaurant_id",
    "name": "Italian Bistro",
    "description": "Authentic Italian cuisine",
    "cuisine": "italian",
    "rating": 4.5,
    "address": "456 Restaurant Ave",
    "isActive": true
  }
]
```

#### Get Restaurant Details
- **URL**: `/api/catalog/restaurants/:id`
- **Method**: GET

#### Get Restaurant Menu
- **URL**: `/api/catalog/restaurants/:id/menu`
- **Method**: GET
- **Response**:
```json
[
  {
    "id": "menu_item_id",
    "name": "Margherita Pizza",
    "description": "Classic tomato and mozzarella",
    "price": 15.99,
    "category": "pizza",
    "isAvailable": true,
    "restaurantId": "restaurant_id"
  }
]
```

### Menu Management (Restaurant Owner)

#### Add Menu Item
- **URL**: `/api/catalog/restaurants/:id/menu`
- **Method**: POST
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "name": "New Pizza",
  "description": "Delicious new recipe",
  "price": 18.99,
  "category": "pizza",
  "ingredients": ["dough", "sauce", "cheese"],
  "allergens": ["gluten", "dairy"]
}
```

---

## Order Service (Port 3003)

### Order Management

#### Create Order
- **URL**: `/api/orders`
- **Method**: POST
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "restaurantId": "restaurant_id",
  "items": [
    {
      "menuItemId": "menu_item_id",
      "quantity": 2,
      "specialInstructions": "Extra cheese"
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```
- **Response**:
```json
{
  "id": "order_id",
  "userId": "user_id",
  "restaurantId": "restaurant_id",
  "status": "pending",
  "totalAmount": 31.98,
  "items": [...],
  "estimatedDeliveryTime": "2025-10-25T11:30:00Z"
}
```

#### Get User Orders
- **URL**: `/api/orders`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`

#### Get Order Details
- **URL**: `/api/orders/:id`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`

#### Cancel Order
- **URL**: `/api/orders/:id/cancel`
- **Method**: PUT
- **Headers**: `Authorization: Bearer <token>`

#### Update Order Status (Restaurant)
- **URL**: `/api/orders/:id/status`
- **Method**: PUT
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "status": "preparing",
  "estimatedReadyTime": "2025-10-25T11:15:00Z"
}
```

---

## Payment Service (Port 3004)

### REST API Endpoints

#### Process Payment
- **URL**: `/api/payments/process`
- **Method**: POST
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "orderId": "order_id",
  "amount": 31.98,
  "method": "credit_card",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "cardHolderName": "John Doe",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123"
  }
}
```

#### Get Payment Status
- **URL**: `/api/payments/:paymentId`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`

#### Refund Payment
- **URL**: `/api/payments/:paymentId/refund`
- **Method**: POST
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "amount": 31.98,
  "reason": "Order cancelled"
}
```

### gRPC API

#### Proto Definition
```protobuf
service PaymentService {
  rpc ProcessPayment(PaymentRequest) returns (PaymentResponse);
  rpc RefundPayment(RefundRequest) returns (RefundResponse);
  rpc GetPaymentStatus(PaymentStatusRequest) returns (PaymentStatusResponse);
}

message PaymentRequest {
  string order_id = 1;
  string user_id = 2;
  double amount = 3;
  string currency = 4;
  string payment_method = 5;
  PaymentDetails payment_details = 6;
}
```

---

## Delivery Service (Port 3005)

### Delivery Tracking

#### Get Delivery Status
- **URL**: `/api/delivery/order/:orderId/status`
- **Method**: GET
- **Response**:
```json
{
  "id": "delivery_id",
  "orderId": "order_id",
  "driverId": "driver_id",
  "status": "on_the_way",
  "currentLocation": {
    "latitude": 40.7589,
    "longitude": -73.9851,
    "address": "Central Park, NY"
  },
  "estimatedArrival": "2025-10-25T11:45:00Z"
}
```

#### Update Delivery Location (Driver)
- **URL**: `/api/delivery/:deliveryId/location`
- **Method**: PUT
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "latitude": 40.7589,
  "longitude": -73.9851,
  "timestamp": "2025-10-25T11:30:00Z"
}
```

#### Complete Delivery
- **URL**: `/api/delivery/:deliveryId/complete`
- **Method**: PUT
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "deliveryProof": "photo_url",
  "customerNotes": "Delivered to front door"
}
```

---

## GraphQL Schema

### Queries
```graphql
type Query {
  # User queries
  me: User
  
  # Catalog queries
  restaurants: [Restaurant!]!
  restaurant(id: ID!): Restaurant
  menuItems(restaurantId: ID!): [MenuItem!]!
  
  # Order queries
  myOrders: [Order!]!
  order(id: ID!): Order
  
  # Delivery queries
  deliveryStatus(orderId: ID!): Delivery
}
```

### Mutations
```graphql
type Mutation {
  # Order mutations
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(orderId: ID!): Order!
  
  # Payment mutations
  processPayment(orderId: ID!, method: String!): Payment!
}
```

### Example GraphQL Queries

#### Get Restaurants with Menu
```graphql
query GetRestaurantsWithMenu {
  restaurants {
    id
    name
    cuisine
    rating
    menu {
      id
      name
      price
      category
    }
  }
}
```

#### Create Order
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    status
    totalAmount
    estimatedDeliveryTime
    items {
      name
      quantity
      price
    }
  }
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details",
  "timestamp": "2025-10-25T10:00:00Z",
  "requestId": "correlation_id"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Rate Limiting

### API Gateway Limits
- **General**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **Order Creation**: 10 orders per hour per user

### Service-Specific Limits
- **User Service**: 50 requests per minute
- **Catalog Service**: 100 requests per minute
- **Order Service**: 20 requests per minute
- **Payment Service**: 10 requests per minute
- **Delivery Service**: 30 requests per minute

---

## Authentication

### JWT Token Structure
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1635163200,
  "exp": 1635249600
}
```

### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Service-to-Service Authentication
Internal services use headers:
```
x-user-id: user_id
x-correlation-id: request_correlation_id
```

This API documentation provides a comprehensive guide for integrating with the Food Ordering microservices platform.