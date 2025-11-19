# Food Ordering System - Comprehensive Swagger API Documentation

## Overview
This food ordering system consists of 6 microservices, each with comprehensive Swagger/OpenAPI documentation. All services are documented with detailed API specifications, authentication requirements, and response schemas.

## Services and Swagger URLs

### 1. API Gateway (Port 8080)
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs
- **Description**: Main API Gateway routing requests to all microservices

### 2. User Service (Port 8081)
- **Swagger UI**: http://localhost:8081/swagger-ui/index.html
- **OpenAPI Spec**: http://localhost:8081/v3/api-docs
- **Description**: User registration, authentication, and profile management
- **Key Endpoints**:
  - `POST /api/users/register` - User registration
  - `POST /api/users/login` - User authentication
  - `GET /api/users/profile` - Get user profile
  - `PUT /api/users/profile` - Update user profile
  - `DELETE /api/users/profile` - Deactivate account

### 3. Catalog Service (Port 8082)
- **Swagger UI**: http://localhost:8082/swagger-ui/index.html
- **OpenAPI Spec**: http://localhost:8082/v3/api-docs
- **Description**: Restaurant catalogs, menus, and food items management
- **Key Endpoints**:
  - `GET /api/restaurants` - List restaurants with pagination
  - `POST /api/restaurants` - Create new restaurant
  - `GET /api/restaurants/{id}` - Get restaurant details
  - `GET /api/restaurants/search` - Search restaurants
  - `GET /api/restaurants/cuisine/{type}` - Filter by cuisine

### 4. Order Service (Port 8083)
- **Swagger UI**: http://localhost:8083/swagger-ui/index.html
- **OpenAPI Spec**: http://localhost:8083/v3/api-docs
- **Description**: Order management throughout their lifecycle
- **Key Endpoints**:
  - `POST /api/orders` - Create new order
  - `GET /api/orders/{id}` - Get order details
  - `GET /api/orders/user/{userId}` - Get user orders
  - `PUT /api/orders/{id}/status` - Update order status
  - `GET /api/orders/stats` - Order statistics

### 5. Payment Service (Port 8084)
- **Swagger UI**: http://localhost:8084/swagger-ui/index.html
- **OpenAPI Spec**: http://localhost:8084/v3/api-docs
- **Description**: Payment processing, transactions, and refunds
- **Key Endpoints**:
  - `POST /api/payments/process` - Process payment
  - `GET /api/payments/status/{transactionId}` - Get payment status
  - `POST /api/payments/refund/{transactionId}` - Process refund
  - `GET /api/payments/methods` - Available payment methods

### 6. Delivery Service (Port 8085)
- **Swagger UI**: http://localhost:8085/swagger-ui/index.html
- **OpenAPI Spec**: http://localhost:8085/v3/api-docs
- **Description**: Delivery operations, tracking, and driver management
- **Key Endpoints**:
  - `POST /api/delivery/assign` - Assign delivery to driver
  - `GET /api/delivery/track/{deliveryId}` - Track delivery
  - `PUT /api/delivery/status/{deliveryId}` - Update delivery status
  - `GET /api/delivery/drivers/available` - Get available drivers

## Authentication
All services use **JWT Bearer Token** authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Features of the Swagger Documentation

### 1. Comprehensive API Coverage
- All endpoints documented with detailed descriptions
- Request/response schemas with examples
- Error codes and responses documented
- Parameter validation and constraints

### 2. Security Documentation
- JWT authentication scheme configured
- Protected endpoints clearly marked
- Security requirements specified per endpoint

### 3. Server Configuration
- Development and production server URLs
- Environment-specific configurations
- Proper contact information and licensing

### 4. Interactive Testing
- Try-out functionality for all endpoints
- Request/response examples
- Parameter input validation
- Authentication testing capabilities

## Quick Start

1. **Start all services** using the provided scripts:
   ```bash
   ./start-springboot-services.sh
   ```

2. **Access Swagger UI** for any service:
   - Navigate to `http://localhost:<port>/swagger-ui/index.html`
   - Replace `<port>` with the service port (8080-8085)

3. **Authentication**:
   - First register/login through User Service
   - Copy the JWT token from the response
   - Use "Authorize" button in Swagger UI to set the token
   - Now you can test protected endpoints

## Service Dependencies Added

The following services now have Swagger dependencies added:
- ✅ User Service (already had dependency)
- ✅ Catalog Service (dependency added)
- ✅ Order Service (dependency added)
- ✅ Payment Service (dependency added)
- ✅ Delivery Service (dependency added)
- ✅ Gateway Service (already had dependency)

## API Documentation Standards

All APIs follow consistent documentation standards:
- Detailed operation summaries and descriptions
- Comprehensive parameter documentation
- Response schema definitions
- Error handling documentation
- Security requirements clearly specified
- Tags for logical grouping of endpoints

## Testing with Swagger UI

1. **Open any service's Swagger UI**
2. **Click "Authorize"** and enter your JWT token
3. **Explore endpoints** by category/tag
4. **Try out endpoints** with the interactive interface
5. **View request/response examples**
6. **Test error scenarios** with invalid data

This comprehensive Swagger documentation provides a complete reference for all API endpoints across your food ordering microservices system.
