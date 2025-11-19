# 🚀 Complete Spring Boot Food Ordering System - Deployment & Testing Guide

## 📋 Overview

This guide provides step-by-step instructions to deploy and test the complete **100% Spring Boot microservices** food ordering system with Docker containerization.

## 🏗️ System Architecture

### Microservices (All Spring Boot 3.2.0 + Java 17)
- **Gateway Service** (Port 8080) - Spring Cloud Gateway + Circuit Breaker + Redis
- **User Service** (Port 8081) - Spring Security + JWT + MongoDB
- **Catalog Service** (Port 8082) - Spring Data MongoDB
- **Order Service** (Port 8083) - Spring Data JPA + PostgreSQL + AMQP
- **Payment Service** (Port 8084) - Spring Data JPA + PostgreSQL + gRPC
- **Delivery Service** (Port 8085) - Spring Data MongoDB + WebSocket + AMQP

### Infrastructure Services
- **PostgreSQL** (Port 5432) - Orders & Payments Database
- **MongoDB** (Port 27017) - Users, Catalog & Delivery Database
- **RabbitMQ** (Port 5672/15672) - Message Queue + Management UI
- **Redis** (Port 6379) - Gateway Cache & Session Store

---

## 🛠️ Prerequisites

### Required Software
- **Docker Desktop** (latest version)
- **Java 17** (OpenJDK or Oracle JDK)
- **Maven 3.8+**
- **Bruno API Client** (for API testing)
- **Git** (for version control)

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: At least 5GB free
- **OS**: macOS, Linux, or Windows with WSL2

---

## 🚀 Quick Start Deployment

### Step 1: Clone and Navigate to Project
```bash
# Clone the repository (if not already done)
git clone https://github.com/samadrita-shaw/g10-food-ordering.git
cd g10-food-ordering
```

### Step 2: Verify Project Structure
```bash
# Verify all Spring Boot services are present
ls -la */pom.xml
# Should show:
# - gateway-springboot/pom.xml
# - user-service-springboot/pom.xml
# - catalog-service-springboot/pom.xml
# - order-service-springboot/pom.xml
# - payment-service-springboot/pom.xml
# - delivery-service-springboot/pom.xml
```

### Step 3: Build All Spring Boot Services
```bash
# Build all services in sequence
for service in gateway-springboot user-service-springboot catalog-service-springboot order-service-springboot payment-service-springboot delivery-service-springboot; do
    echo "🔨 Building $service..."
    cd $service
    mvn clean package -DskipTests
    cd ..
done
```

### Step 4: Start Docker Desktop
```bash
# On macOS - Auto-start Docker Desktop
open -a Docker

# Wait for Docker to be ready (about 30-60 seconds)
docker --version
docker-compose --version
```

### Step 5: Deploy Complete System
```bash
# Navigate to infrastructure directory
cd dev-infra

# Deploy all services with Docker Compose
docker-compose down --remove-orphans  # Clean any existing containers
docker-compose up -d --build          # Build and start all services

# Verify all containers are running
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

### Step 6: Wait for Services to Initialize
```bash
# Wait 30-60 seconds for all services to fully start
sleep 60

# Check health status
for port in 8080 8081 8082 8083 8084 8085; do
    echo "Testing port $port:"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/actuator/health || echo "Still initializing..."
    echo ""
done
```

---

## 🔍 Deployment Verification

### Check All Containers Are Running
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

**Expected Output:**
```
NAMES                                       PORTS                                     STATUS
food-ordering-gateway-springboot            0.0.0.0:8080->8080/tcp                   Up X minutes
food-ordering-user-service-springboot       0.0.0.0:8081->8080/tcp                   Up X minutes
food-ordering-catalog-service-springboot    0.0.0.0:8082->8080/tcp                   Up X minutes
food-ordering-order-service-springboot      0.0.0.0:8083->8080/tcp                   Up X minutes
food-ordering-payment-service-springboot    0.0.0.0:8084->8080/tcp, 50051->50051/tcp Up X minutes
food-ordering-delivery-service-springboot   0.0.0.0:8085->8080/tcp                   Up X minutes
food-ordering-postgres                      0.0.0.0:5432->5432/tcp                   Up X minutes
food-ordering-mongodb                       0.0.0.0:27017->27017/tcp                 Up X minutes
food-ordering-rabbitmq                      0.0.0.0:5672->5672/tcp, 15672->15672/tcp Up X minutes
food-ordering-redis                         0.0.0.0:6379->6379/tcp                   Up X minutes
```

### Verify Service Health
```bash
# Check Spring Boot Actuator health endpoints
curl http://localhost:8080/actuator/health  # Gateway
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Catalog Service
curl http://localhost:8083/actuator/health  # Order Service
curl http://localhost:8084/actuator/health  # Payment Service
curl http://localhost:8085/actuator/health  # Delivery Service
```

**Expected Response:**
```json
{
  "status": "UP"
}
```

---

## 🧪 API Testing with Bruno

### Step 1: Install Bruno API Client
```bash
# macOS
brew install bruno

# Or download from: https://github.com/usebruno/bruno/releases
```

### Step 2: Open Bruno Collections
```bash
# Navigate to testing directory
cd testing/bruno-collections

# Open Bruno with the collection
bruno .
```

### Step 3: Configure Environment
1. In Bruno, select **"Local Development"** environment
2. Verify environment variables:
   - `gatewayUrl`: `http://localhost:8080`
   - `userServiceUrl`: `http://localhost:8081`
   - `catalogServiceUrl`: `http://localhost:8082`
   - `orderServiceUrl`: `http://localhost:8083`
   - `paymentServiceUrl`: `http://localhost:8084`
   - `deliveryServiceUrl`: `http://localhost:8085`

### Step 4: Run Test Collections

#### 🔍 1. Health Checks
**File**: `01-health-checks-all.bru`
```
Test all Spring Boot Actuator health endpoints
Expected: All services return status "UP"
```

#### 👤 2. User Management Tests
**Files**: 
- `02-user-registration.bru` - Register new user
- `03-user-login.bru` - Login and get JWT token
- `04-user-profile.bru` - Get user profile with authentication

**Test Flow**:
1. Register user: `POST /api/users/register`
2. Login user: `POST /api/users/login` (saves JWT token)
3. Get profile: `GET /api/users/profile` (uses saved token)

#### 🍕 3. Restaurant & Menu Tests
**Files**:
- `05-create-restaurant.bru` - Create restaurant
- `05-get-restaurants.bru` - List all restaurants
- `06-get-menu.bru` - Get restaurant menu

#### 🛒 4. Order Management Tests
**Files**:
- `07-create-order.bru` - Create new order
- `08-get-order-details.bru` - Get order with items

#### 💳 5. Payment Processing Tests
**File**: `09-process-payment.bru`
```
Tests gRPC payment processing integration
```

#### 🚚 6. Delivery Tracking Tests
**File**: `10-delivery-tracking.bru`
```
Tests WebSocket real-time delivery updates
```

#### 🌐 7. Gateway & Error Handling Tests
**Files**:
- `11-gateway-routing.bru` - Test Spring Cloud Gateway routing
- `12-error-handling.bru` - Test circuit breaker patterns

---

## 📊 Manual API Testing (Using cURL)

### User Service Tests
```bash
# 1. Register a new user
curl -X POST http://localhost:8081/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Login user (get JWT token)
JWT_TOKEN=$(curl -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }' | jq -r '.token')

echo "JWT Token: $JWT_TOKEN"

# 3. Get user profile
curl -X GET http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Catalog Service Tests
```bash
# 1. Create a restaurant
RESTAURANT_ID=$(curl -X POST http://localhost:8082/api/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace",
    "description": "Best pizza in town",
    "address": "123 Main St",
    "phone": "555-1234",
    "cuisine": "Italian"
  }' | jq -r '.id')

echo "Restaurant ID: $RESTAURANT_ID"

# 2. Add menu item
curl -X POST http://localhost:8082/api/restaurants/$RESTAURANT_ID/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Margherita Pizza",
    "description": "Classic tomato and mozzarella",
    "price": 12.99,
    "category": "Pizza",
    "available": true
  }'

# 3. Get all restaurants
curl -X GET http://localhost:8082/api/restaurants
```

### Order Service Tests
```bash
# 1. Create an order
ORDER_ID=$(curl -X POST http://localhost:8083/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "restaurantId": "'$RESTAURANT_ID'",
    "items": [
      {
        "menuItemId": "menu_item_id_here",
        "quantity": 2,
        "price": 12.99
      }
    ],
    "deliveryAddress": "456 Oak Ave"
  }' | jq -r '.id')

echo "Order ID: $ORDER_ID"

# 2. Get order details
curl -X GET http://localhost:8083/api/orders/$ORDER_ID \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Gateway Routing Tests
```bash
# Test gateway routing to different services
curl -X GET http://localhost:8080/api/users/health      # Routes to User Service
curl -X GET http://localhost:8080/api/restaurants       # Routes to Catalog Service
curl -X GET http://localhost:8080/api/orders           # Routes to Order Service
curl -X GET http://localhost:8080/api/payments         # Routes to Payment Service
curl -X GET http://localhost:8080/api/deliveries       # Routes to Delivery Service
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Docker Not Running
```bash
# Start Docker Desktop
open -a Docker

# Wait for Docker to initialize
docker --version
```

#### 2. Port Conflicts
```bash
# Check what's using the ports
lsof -i :8080-8085
lsof -i :5432,27017,5672,6379

# Kill processes if needed
kill -9 <PID>
```

#### 3. Services Not Starting
```bash
# Check service logs
cd dev-infra
docker-compose logs gateway
docker-compose logs user-service
docker-compose logs catalog-service
docker-compose logs order-service
docker-compose logs payment-service
docker-compose logs delivery-service

# Restart specific service
docker-compose restart <service-name>
```

#### 4. Database Connection Issues
```bash
# Check database containers
docker-compose logs postgres
docker-compose logs mongodb

# Verify database connectivity
docker exec -it food-ordering-postgres psql -U admin -d food_ordering -c "\dt"
docker exec -it food-ordering-mongodb mongo --eval "db.adminCommand('listCollections')"
```

#### 5. Memory Issues
```bash
# Check Docker resource usage
docker stats

# Increase Docker memory limit in Docker Desktop preferences
# Recommended: 8GB+ RAM allocation
```

### Service-Specific Troubleshooting

#### User Service (JWT Issues)
```bash
# Check JWT configuration
docker-compose logs user-service | grep -i jwt

# Verify MongoDB connection
docker exec -it food-ordering-mongodb mongo food_ordering_users --eval "db.users.count()"
```

#### Order Service (Database Schema)
```bash
# Check PostgreSQL tables
docker exec -it food-ordering-postgres psql -U admin -d food_ordering -c "\dt"

# Verify Hibernate schema creation
docker-compose logs order-service | grep -i hibernate
```

#### Payment Service (gRPC)
```bash
# Check gRPC port is open
netstat -an | grep 50051

# Test gRPC connectivity
docker-compose logs payment-service | grep -i grpc
```

---

## 🛠️ Development Commands

### Build Commands
```bash
# Build all services
./build-all.sh

# Build specific service
cd <service-name>
mvn clean package -DskipTests
```

### Docker Commands
```bash
# Full system restart
cd dev-infra
docker-compose down --remove-orphans
docker-compose up -d --build

# Restart specific service
docker-compose restart <service-name>

# View logs
docker-compose logs -f <service-name>

# Clean Docker system
docker system prune -a
```

### Database Commands
```bash
# PostgreSQL
docker exec -it food-ordering-postgres psql -U admin -d food_ordering

# MongoDB
docker exec -it food-ordering-mongodb mongo food_ordering_users

# RabbitMQ Management UI
open http://localhost:15672  # admin/password
```

---

## 📈 Monitoring and Health Checks

### Spring Boot Actuator Endpoints
```bash
# Health check
curl http://localhost:808X/actuator/health

# Application info
curl http://localhost:808X/actuator/info

# Environment variables
curl http://localhost:808X/actuator/env

# Application metrics
curl http://localhost:808X/actuator/metrics
```

### Infrastructure Monitoring
```bash
# RabbitMQ Management UI
open http://localhost:15672

# Container resource usage
docker stats

# System resource usage
top
df -h
```

---

## 🚀 Production Deployment Notes

### Environment Configuration
1. **Update application-prod.yml** files for each service
2. **Set secure JWT secrets** and database passwords
3. **Configure external databases** (not containerized)
4. **Set up load balancers** for Spring Cloud Gateway
5. **Configure monitoring** with Prometheus and Grafana

### Security Checklist
- [ ] Change default database passwords
- [ ] Use production JWT secrets (256-bit)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable audit logging

### Performance Optimization
- [ ] Configure JVM memory settings
- [ ] Set up database connection pooling
- [ ] Configure Redis caching
- [ ] Enable HTTP/2 in gateway
- [ ] Set up CDN for static assets

---

## 📚 Additional Resources

### Documentation
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Cloud Gateway](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Bruno API Client](https://github.com/usebruno/bruno)

### Architecture Diagrams
- System architecture: `docs/architecture/system-overview.md`
- Database schema: `docs/database/schema.md`
- API documentation: `docs/api/swagger-ui/`

---

## 🎯 Success Criteria

✅ **All 6 Spring Boot services running**  
✅ **All 4 infrastructure services operational**  
✅ **Health checks returning 200 OK**  
✅ **Bruno API tests passing**  
✅ **End-to-end user journey working**  
✅ **Real-time features functional (WebSocket)**  
✅ **Authentication & authorization working**  
✅ **Database transactions completing**  

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs <service-name>`
3. Verify system requirements and dependencies
4. Check Docker Desktop is running with sufficient resources

**System is now ready for development and testing! 🚀**