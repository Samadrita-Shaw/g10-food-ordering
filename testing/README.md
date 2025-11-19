# 🧪 Testing Guide for G10 Food Ordering Application (Spring Boot)

## 📋 Overview

This guide provides comprehensive testing procedures for the G10 Food Ordering **Spring Boot microservices** application. All testing tools and API collections are updated for the Spring Boot architecture.

## 🛠️ Testing Tools Setup

### Prerequisites
- **Docker Desktop** - For running infrastructure services (MongoDB, PostgreSQL, RabbitMQ, Redis)
- **Java 17+** - JDK for Spring Boot services
- **Maven 3.8+** - Build tool for Spring Boot applications
- **Bruno** - API testing client (recommended)
- **curl** - Command-line HTTP testing

### Installation
```bash
# Install Bruno (VS Code Extension or Standalone)
# Search for "Bruno" in VS Code Extensions marketplace

# Or install Bruno CLI
npm install -g @usebruno/cli

# Verify tools
docker --version
java --version
mvn --version
curl --version
```

## 🚀 Quick Start Testing (Spring Boot)

### Step 1: Setup and Start Spring Boot Services
```bash
# Navigate to project root
cd /path/to/g10-food-ordering

# Start all Spring Boot services with Docker
./start-springboot-services.sh

# This script will:
# - Start infrastructure services (MongoDB, PostgreSQL, RabbitMQ, Redis)
# - Build and deploy all 6 Spring Boot microservices
# - Verify all services are healthy
```

### Step 2: Validate Spring Boot Setup
```bash
# Run validation script
./validate-springboot-setup.sh

# Expected output:
# ✅ All 6 Spring Boot services properly structured
# ✅ Maven pom.xml files configured
# ✅ Spring Boot Application classes present
```

### Step 3: Health Check All Services
```bash
# Verify all Spring Boot services are running
./testing/scripts/health-check.sh

# Expected output:
# ✅ Gateway Service (8080): UP
# ✅ User Service (8081): UP
# ✅ Catalog Service (8082): UP
# ✅ Order Service (8083): UP
# ✅ Payment Service (8084): UP
# ✅ Delivery Service (8085): UP
# ✅ PostgreSQL (5432): RUNNING
# ✅ RabbitMQ Management (15672): RUNNING
# ✅ Redis (6379): RUNNING
# ✅ Gateway (3000): HEALTHY
# ✅ User Service (3001): HEALTHY
# ✅ Catalog Service (3002): HEALTHY
# ✅ Order Service (3003): HEALTHY
# ✅ Payment Service (3004): HEALTHY
# ✅ Delivery Service (3005): HEALTHY
```

### Step 3: Run Complete Test Suite
```bash
# Run all automated tests
./testing/scripts/run-all-tests.sh

# This will test:
# - Service health endpoints
# - Authentication flow
# - Core API functionality
# - GraphQL queries
# - Circuit breaker pattern
# - Error handling
```

## 🔍 Bruno API Testing

### Import Collections
1. Open Bruno application
2. Import collection from: `./testing/bruno-collections/`
3. Set environment to "Local Development"

### Available Test Collections

#### 1. Health Checks
- **File**: `01-health-checks.bru`
- **Purpose**: Verify all services are responding
- **Expected**: HTTP 200 with status "healthy"

#### 2. User Registration
- **File**: `02-user-registration.bru`
- **Purpose**: Test user account creation
- **Expected**: HTTP 201 with user object and JWT token

#### 3. User Login
- **File**: `03-user-login.bru`
- **Purpose**: Test authentication
- **Expected**: HTTP 200 with JWT token
- **Note**: Token is automatically stored for subsequent tests

#### 4. User Profile
- **File**: `04-user-profile.bru`
- **Purpose**: Test authenticated endpoint
- **Expected**: HTTP 200 with user profile data
- **Requires**: Valid JWT token from login

#### 5. Restaurant Listing
- **File**: `05-get-restaurants.bru`
- **Purpose**: Test catalog service
- **Expected**: HTTP 200 with restaurant array

#### 6. Restaurant Menu
- **File**: `06-get-menu.bru`
- **Purpose**: Test menu retrieval
- **Expected**: HTTP 200 with menu items array

#### 7. Order Creation
- **File**: `07-create-order.bru`
- **Purpose**: Test order processing (triggers Saga pattern)
- **Expected**: HTTP 201 with order object
- **Requires**: Authentication

#### 8. Order Details
- **File**: `08-get-order-details.bru`
- **Purpose**: Test order retrieval
- **Expected**: HTTP 200 with complete order data

#### 9. GraphQL Restaurants
- **File**: `09-graphql-restaurants.bru`
- **Purpose**: Test GraphQL API
- **Expected**: HTTP 200 with GraphQL response structure

#### 10. GraphQL User Orders
- **File**: `10-graphql-user-orders.bru`
- **Purpose**: Test authenticated GraphQL query
- **Expected**: HTTP 200 with user's order history

## 🔄 Testing Workflows

### Complete User Journey Test
```bash
# Run tests in sequence to simulate real user flow:
# 1. Register → 2. Login → 3. Browse Restaurants → 4. View Menu → 5. Create Order

# Using Bruno:
# Run collections 02 through 07 in order
```

### Service Health Monitoring
```bash
# Continuous health monitoring
watch -n 5 './testing/scripts/health-check.sh'

# Check specific service
curl http://localhost:3000/health | jq '.'
curl http://localhost:3001/health | jq '.'
```

### GraphQL Testing
```bash
# Direct GraphQL queries
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { restaurants { id name cuisine_type rating } }"
  }' | jq '.'

# Authenticated GraphQL query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "query { myOrders { id status total_amount } }"
  }' | jq '.'
```

## 🎯 What to Look For

### ✅ Success Indicators

#### Health Checks
- All services return HTTP 200
- Response contains `"status": "healthy"`
- Response time < 2 seconds

#### Authentication
- Registration returns HTTP 201 with user object and JWT token
- Login returns HTTP 200 with valid JWT token
- Protected endpoints accept valid tokens

#### API Functionality
- Restaurant listing returns HTTP 200 with array of restaurants
- Order creation returns HTTP 201 with order ID
- GraphQL queries return proper data structure

#### System Integration
- Orders trigger events across services
- Payment processing works via gRPC
- Circuit breaker provides fallback responses

### ❌ Failure Indicators

#### Service Issues
- HTTP 503 (Service Unavailable)
- HTTP 500 (Internal Server Error)
- Connection timeouts or refused connections

#### Authentication Problems
- HTTP 401 (Unauthorized) for valid tokens
- HTTP 403 (Forbidden) for proper permissions
- Invalid or expired JWT tokens

#### Data Issues
- Empty arrays when data should exist
- Missing required fields in responses
- Incorrect data types or formats

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Services Not Responding
```bash
# Check if containers are running
docker-compose ps

# View service logs
docker-compose logs gateway
docker-compose logs user-service

# Restart services
docker-compose restart
```

#### 2. Database Connection Issues
```bash
# Check database containers
docker-compose ps | grep -E "(mongo|postgres|redis)"

# Test database connectivity
docker exec -it mongodb mongosh --eval "db.adminCommand('ismaster')"
docker exec -it postgres psql -U postgres -d food_ordering -c "SELECT 1;"
```

#### 3. Port Conflicts
```bash
# Check what's using a port
lsof -i :3000
lsof -i :3001

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### 4. Authentication Issues
```bash
# Test user registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "profile": {"firstName": "Test", "lastName": "User"}
  }'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Debug Mode Testing
```bash
# Run services in debug mode
DEBUG=* npm start  # For Node.js services

# View detailed logs
docker-compose logs -f --tail=100

# Check environment variables
docker-compose exec gateway env | grep -E "(URL|PORT|SECRET)"
```

## 📊 Test Reports

### Automated Report Generation
The `run-all-tests.sh` script generates comprehensive reports:

```bash
# Reports are saved in testing/test-report-YYYYMMDD_HHMMSS.txt
# Example content:
G10 Food Ordering - API Test Report
==================================

Test Date: 2025-11-02 15:30:45
Environment: Local Development
Gateway URL: http://localhost:3000

Test Results:
- Total Tests: 25
- Passed: 24
- Failed: 1
- Success Rate: 96%

Service Health Status:
- Gateway Service: 200
- User Service: 200
- Catalog Service: 200
...
```

### Manual Testing Checklist

#### Basic Functionality ✅
- [ ] All services start without errors
- [ ] Health endpoints return 200
- [ ] User registration works
- [ ] User login returns JWT token
- [ ] Restaurant listing loads
- [ ] Order creation succeeds

#### Advanced Features ✅
- [ ] GraphQL queries work
- [ ] Authentication protects endpoints
- [ ] Circuit breaker activates on service failure
- [ ] Message queue events flow properly
- [ ] gRPC payment processing works
- [ ] Real-time features function

#### Error Handling ✅
- [ ] Invalid requests return proper error codes
- [ ] Unauthorized access returns 401
- [ ] Missing resources return 404
- [ ] Service failures trigger fallbacks

## 🎯 Performance Testing

### Load Testing (Optional)
```bash
# Install k6 (if available)
brew install k6  # macOS
# or use wrk, ab, or similar tools

# Simple load test
k6 run - <<EOF
import http from 'k6/http';
export default function () {
  http.get('http://localhost:3000/health');
}
EOF
```

### Response Time Monitoring
```bash
# Monitor API response times
curl -w "Response time: %{time_total}s\n" -o /dev/null -s http://localhost:3000/health

# Multiple requests
for i in {1..10}; do
  curl -w "Request $i: %{time_total}s\n" -o /dev/null -s http://localhost:3000/api/restaurants
done
```

## 🔐 Security Testing

### Authentication Testing
```bash
# Test without token (should fail)
curl -X GET http://localhost:3001/api/users/profile

# Test with invalid token (should fail)
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer invalid_token"

# Test with valid token (should succeed)
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_VALID_TOKEN"
```

### Input Validation Testing
```bash
# Test invalid email format
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "password123"}'

# Test weak password
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123"}'
```

---

## 🎉 Success Criteria

Your Food Ordering application is working correctly when:

1. **All health checks pass** ✅
2. **User registration and login work** ✅
3. **Restaurant data loads properly** ✅
4. **Orders can be created and tracked** ✅
5. **GraphQL queries return data** ✅
6. **Authentication protects resources** ✅
7. **Error handling is graceful** ✅
8. **Circuit breaker provides resilience** ✅

**When all tests pass, your microservices application is ready for demo and evaluation!** 🚀