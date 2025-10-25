# G10 Food Ordering Microservices Application

## 🏆 Project Overview
A **complete microservices-based food ordering platform** implementing modern service design patterns, multiple communication protocols, and cloud-native deployment practices. This project demonstrates enterprise-grade architecture with 6 microservices, event-driven communication, and comprehensive testing strategies.

## 🎯 Problem Domain
The application solves the comprehensive food ordering domain by providing:
- **Restaurant catalog management** with geospatial search
- **User registration and authentication** with JWT tokens
- **Order processing and management** with distributed transactions
- **Payment processing** via multiple gateways (gRPC implementation)
- **Real-time delivery tracking** with driver management
- **API gateway** for unified access and cross-cutting concerns

## 🏗️ Microservices Architecture

### Service Decomposition Strategy
**Decomposition by Business Capability**: Each service represents a distinct business capability in the food ordering domain with independent data stores and deployment pipelines.

### ✅ Implemented Services (6 Microservices)

1. **🚪 Gateway Service** (Port 3000)
   - API Gateway pattern implementation
   - GraphQL and REST endpoint aggregation
   - Authentication middleware and rate limiting
   - Circuit breaker for fault tolerance
   - Redis caching layer

2. **👤 User Service** (Port 3001)
   - User registration, authentication, profile management
   - JWT token generation and validation
   - Address management with geospatial indexing
   - User preferences and dietary restrictions
   - MongoDB data store

3. **🍽️ Catalog Service** (Port 3002)
   - Restaurant and menu item management
   - Geospatial restaurant search by location
   - Menu categorization and ingredient tracking
   - Restaurant ratings and reviews
   - MongoDB with geospatial indexes

4. **📦 Order Service** (Port 3003)
   - Order creation, management, and tracking
   - **CQRS pattern implementation** (Command Query Responsibility Segregation)
   - **Saga pattern orchestration** for distributed transactions
   - Order state management with compensation logic
   - PostgreSQL for ACID transactions

5. **💳 Payment Service** (Port 3004)
   - Payment processing with multiple gateways
   - **gRPC server implementation** (Port 50051)
   - Payment method management
   - Refund processing and transaction logging
   - PostgreSQL for financial data integrity

6. **🚚 Delivery Service** (Port 3005)
   - Real-time delivery tracking and driver management
   - Location updates with geospatial data
   - Driver assignment algorithms
   - Delivery status management
   - Python/FastAPI with MongoDB

## 🔄 Communication Mechanisms ✅

### 1. **REST APIs** 
- Primary communication for CRUD operations across all services
- OpenAPI/Swagger documentation for each service
- JWT authentication middleware
- Error handling with proper HTTP status codes

### 2. **gRPC** 
- High-performance communication between Order and Payment services
- Protocol Buffer definitions with typed contracts
- Server streaming for real-time payment status
- Implemented in Payment Service (Port 50051)

### 3. **GraphQL** 
- Flexible data fetching for mobile/web clients via Gateway
- Type-safe schema with resolvers
- Real-time subscriptions for order updates
- Apollo Server implementation

### 4. **Message Broker (RabbitMQ)** 
- Asynchronous event-driven communication
- Topic-based routing for order lifecycle events
- Dead letter queues for failed message handling
- Event sourcing for order saga pattern

## 🎨 Design Patterns Implemented ✅

### 1. **API Gateway Pattern**
- **Location**: `gateway/` service
- **Features**: 
  - Centralized entry point for all client requests
  - Request routing to appropriate microservices
  - Authentication and authorization
  - Rate limiting (100 req/min per IP)
  - Circuit breaker implementation
  - Response caching with Redis

### 2. **Database-per-Service Pattern**
- **User Service**: MongoDB for flexible user profiles and addresses
- **Catalog Service**: MongoDB for restaurant data with geospatial indexing
- **Order Service**: PostgreSQL for transactional order data with ACID properties
- **Payment Service**: PostgreSQL for financial transaction integrity
- **Delivery Service**: MongoDB for real-time location tracking
- **Gateway Service**: Redis for caching and session management

### 3. **Saga Pattern (Choreography-based)**
- **Location**: `order-service/src/saga/`
- **Implementation**: Distributed transaction management for order processing
- **Components**: OrderSaga, SagaOrchestrator, CompensationHandlers
- **Use Cases**: Order workflow with automatic compensation on failures
- **Events**: Order→Payment→Delivery→Completion with rollback capabilities

### 4. **CQRS (Command Query Responsibility Segregation)**
- **Location**: `order-service/src/cqrs/`
- **Implementation**: Separate read and write operations for optimal performance
- **Components**: CommandHandlers (writes), QueryHandlers (reads), EventStore
- **Benefits**: Optimized queries, independent scaling, event sourcing capabilities

### 5. **Circuit Breaker Pattern**
- **Location**: `gateway/src/utils/circuitBreaker.js`
- **Implementation**: Fault tolerance for inter-service communication
- **States**: CLOSED → OPEN → HALF_OPEN → CLOSED
- **Features**: Automatic failure detection, fallback responses, health monitoring

## 💾 Technology Stack

### **Backend Services**
- **Node.js 18** (5 services): Express.js, TypeScript support
- **Python 3.9** (1 service): FastAPI, AsyncIO for high performance

### **Databases**
- **MongoDB 5.0**: Document storage with geospatial capabilities
- **PostgreSQL 14**: Relational data with ACID transactions
- **Redis 7.0**: Caching and session storage

### **Message Broker**
- **RabbitMQ 3.11**: Event-driven communication with topic exchanges

### **Containerization & Orchestration**
- **Docker**: Multi-stage builds with health checks
- **Kubernetes**: Production-ready manifests with HPA
- **Minikube**: Local development cluster

### **API & Documentation**
- **GraphQL**: Apollo Server with subscriptions
- **gRPC**: Protocol Buffers with type safety
- **OpenAPI/Swagger**: REST API documentation

## 📂 Project Structure

```
g10-food-ordering/
├── README.md                           # Complete project documentation
├── build-and-deploy.sh                 # Automated deployment script
├── docs/                               # Architecture diagrams
│   ├── architecture-overview.md
│   ├── api-documentation.md
│   └── deployment-guide.md
├── dev-infra/                          # Development infrastructure
│   ├── docker-compose.yml              # Local development setup
│   └── k8s/                           # Kubernetes manifests
│       ├── namespace.yaml
│       ├── secrets.yaml
│       ├── infrastructure.yaml         # MongoDB, PostgreSQL, RabbitMQ, Redis
│       └── services.yaml              # All microservice deployments
├── gateway/                           # API Gateway Service (Node.js)
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── app.js                     # Express + Apollo Server setup
│   │   ├── graphql/                   # GraphQL schema and resolvers
│   │   ├── middleware/                # Auth, rate limiting, CORS
│   │   ├── routes/                    # REST proxy routes
│   │   └── utils/circuitBreaker.js    # Circuit breaker implementation
├── user-service/                     # User Management Service (Node.js)
│   ├── Dockerfile
│   ├── src/
│   │   ├── models/user.js            # User model with bcrypt
│   │   ├── routes/auth.js            # Authentication endpoints
│   │   ├── routes/profile.js         # Profile management
│   │   ├── middleware/auth.js        # JWT validation
│   │   └── services/messageHandler.js # RabbitMQ integration
├── catalog-service/                  # Restaurant Catalog Service (Node.js)
│   ├── Dockerfile
│   ├── src/
│   │   ├── models/restaurant.js      # Restaurant model with geospatial
│   │   ├── models/menuItem.js        # Menu item model
│   │   ├── routes/restaurants.js     # Restaurant CRUD operations
│   │   ├── routes/search.js          # Geospatial search endpoints
│   │   └── services/messageHandler.js # Event handling
├── order-service/                    # Order Processing Service (Node.js)
│   ├── Dockerfile
│   ├── src/
│   │   ├── models/                   # PostgreSQL models (Sequelize)
│   │   ├── cqrs/                     # CQRS implementation
│   │   │   ├── commands/             # Command handlers
│   │   │   └── queries/              # Query handlers
│   │   ├── saga/                     # Saga pattern implementation
│   │   │   ├── orderSaga.js          # Main saga orchestrator
│   │   │   └── compensationHandlers.js # Rollback logic
│   │   ├── grpc/clients/             # gRPC client for Payment service
│   │   └── services/messageHandler.js # RabbitMQ integration
├── payment-service/                  # Payment Processing Service (Node.js)
│   ├── Dockerfile
│   ├── src/
│   │   ├── models/                   # PostgreSQL models
│   │   ├── grpc/                     # gRPC server implementation
│   │   │   ├── payment.proto         # Protocol buffer definition
│   │   │   └── paymentGrpcService.js # gRPC service handlers
│   │   ├── routes/                   # REST endpoints
│   │   └── services/               
│   │       ├── paymentGateway.js     # Payment gateway integration
│   │       └── messageHandler.js     # Event handling
└── delivery-service/                 # Delivery Tracking Service (Python)
    ├── Dockerfile
    ├── requirements.txt              # Python dependencies
    ├── main.py                       # FastAPI application
    └── app/
        ├── models/delivery.py        # Pydantic models
        ├── services/delivery_service.py # Business logic
        ├── services/message_handler.py # RabbitMQ integration
        └── database.py               # MongoDB connection
```

## 🚀 Getting Started

### Prerequisites
```bash
# Required Software
- Docker Desktop 4.0+
- Node.js 18+
- Python 3.9+
- kubectl (for Kubernetes deployment)
- Minikube (for local Kubernetes cluster)

# Optional Tools
- Postman/Insomnia (API testing)
- MongoDB Compass (database management)
- pgAdmin (PostgreSQL management)
```

### 🔧 Quick Setup (3 Options)

#### Option 1: Complete Docker Deployment (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd g10-food-ordering

# Build and deploy everything
chmod +x build-and-deploy.sh
./build-and-deploy.sh

# Access the application
# Gateway: http://localhost:3000
# GraphQL Playground: http://localhost:3000/graphql
```

#### Option 2: Local Development Mode
```bash
# Start infrastructure services
cd dev-infra
docker-compose up -d

# Install and start each service (in separate terminals)
cd gateway && npm install && npm start          # Terminal 1
cd user-service && npm install && npm start     # Terminal 2  
cd catalog-service && npm install && npm start  # Terminal 3
cd order-service && npm install && npm start    # Terminal 4
cd payment-service && npm install && npm start  # Terminal 5
cd delivery-service && pip install -r requirements.txt && python main.py # Terminal 6
```

#### Option 3: Kubernetes Deployment
```bash
# Start Minikube
minikube start

# Deploy with script
./build-and-deploy.sh

# Or manual deployment
kubectl apply -f dev-infra/k8s/

# Access services
minikube service gateway-service -n food-ordering --url
```

## 🧪 Testing the Implementation

### Health Checks
```bash
# Verify all services are running
curl http://localhost:3000/health  # Gateway
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Catalog Service  
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Payment Service
curl http://localhost:3005/health  # Delivery Service
```

### End-to-End User Journey Test
```bash
# 1. Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890"
    }
  }'

# 2. Login and get JWT token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# 3. Get restaurants
curl http://localhost:3002/api/restaurants

# 4. Place an order
curl -X POST http://localhost:3003/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "restaurant_id_here",
    "items": [{"menu_item_id": "item_id", "quantity": 2}],
    "delivery_address": {
      "street": "123 Main St",
      "city": "City",
      "zipCode": "12345"
    }
  }'

# 5. Test GraphQL (via Gateway)
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { restaurants { id name cuisine_type rating } }"
  }'
```

## 📊 API Documentation

### 🚪 Gateway Service (Port 3000)
- **GraphQL Playground**: http://localhost:3000/graphql
- **Health Check**: GET http://localhost:3000/health
- **REST Proxy**: All service endpoints proxied through gateway

### 👤 User Service (Port 3001)
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - User authentication  
GET  /api/users/profile     - Get user profile
PUT  /api/users/profile     - Update user profile
POST /api/users/addresses   - Add delivery address
GET  /api/users/addresses   - Get user addresses
```

### 🍽️ Catalog Service (Port 3002)
```
GET  /api/restaurants               - List all restaurants
GET  /api/restaurants/:id           - Get restaurant details
GET  /api/restaurants/:id/menu      - Get restaurant menu
GET  /api/restaurants/search        - Search restaurants by location/cuisine
POST /api/restaurants               - Create restaurant (admin)
PUT  /api/restaurants/:id           - Update restaurant
GET  /api/menu-items                - Get menu items with filters
```

### 📦 Order Service (Port 3003)
```
POST /api/orders                    - Create new order (CQRS Command)
GET  /api/orders                    - Get user orders (CQRS Query)
GET  /api/orders/:id                - Get order details
PUT  /api/orders/:id/status         - Update order status
GET  /api/orders/:id/track          - Real-time order tracking
GET  /api/orders/:id/events         - Get order event history
```

### 💳 Payment Service (Port 3004)
```
# REST Endpoints
POST /api/payments                  - Process payment
GET  /api/payments/:id              - Get payment details
POST /api/payments/:id/refund       - Process refund
GET  /api/users/:id/payment-methods - Get saved payment methods

# gRPC Service (Port 50051)
ProcessPayment(PaymentRequest) → PaymentResponse
RefundPayment(RefundRequest) → RefundResponse  
GetPaymentStatus(PaymentStatusRequest) → PaymentStatusResponse
```

### 🚚 Delivery Service (Port 3005)
```
GET  /api/deliveries                - List deliveries
POST /api/deliveries                - Create delivery
GET  /api/deliveries/:id            - Get delivery details
POST /api/deliveries/:id/location   - Update delivery location (driver)
GET  /api/deliveries/:id/tracking   - Real-time tracking
GET  /api/drivers/available         - Get available drivers
POST /api/drivers/:id/status        - Update driver status
```

## 🔒 Security Implementation

### 🛡️ Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 24h expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Route Protection**: Middleware validation on protected endpoints
- **Role-Based Access**: Admin, customer, and driver role separation

### 🔐 API Security
- **Rate Limiting**: 100 requests/minute per IP via Gateway
- **Input Validation**: Schema validation on all inputs
- **CORS Configuration**: Secure cross-origin resource sharing
- **SQL Injection Prevention**: Parameterized queries with ORM

### 🏗️ Infrastructure Security
- **Container Security**: Non-root user execution, minimal base images
- **Secrets Management**: Kubernetes secrets for sensitive data
- **Network Policies**: Service-to-service communication rules
- **Health Monitoring**: Automated health checks and alerting

## 📈 Monitoring & Observability

### 🏥 Health Checks & Probes
```yaml
# Kubernetes Health Probes Example
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:  
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 📝 Structured Logging
- **Winston** (Node.js): JSON structured logs with correlation IDs
- **Python Logging**: Structured logging with request tracing
- **Log Levels**: DEBUG, INFO, WARN, ERROR with environment-based configuration
- **Correlation IDs**: End-to-end request tracing across services

### 📊 Metrics & Analytics (Implementation Ready)
- Application performance metrics collection points
- Database connection pool monitoring  
- Message queue depth and processing time tracking
- API response time and error rate monitoring

## 🎯 Performance & Scalability

### ⚡ Caching Strategy
- **Redis Caching**: Session data, frequently accessed restaurant listings
- **Application-Level**: User preferences, menu items cache with TTL
- **Database Optimization**: Proper indexing and connection pooling

### 📈 Scalability Features
- **Horizontal Scaling**: Stateless service design for easy scaling
- **Load Balancing**: Kubernetes service load balancing
- **Auto-scaling**: HPA (Horizontal Pod Autoscaler) configuration
- **Database Sharding**: Ready for horizontal database scaling

### 🏎️ Performance Optimizations
- **Connection Pooling**: Optimized database connection management
- **Geospatial Indexing**: MongoDB 2dsphere indexes for location queries
- **Query Optimization**: Efficient database queries with proper indexes
- **Async Processing**: Non-blocking I/O with async/await patterns

## 🔄 Event-Driven Architecture

### 📡 Message Flow
```
Order Created → Payment Processing → Order Confirmed → Delivery Assigned → In Transit → Delivered
     ↓               ↓                    ↓                ↓               ↓          ↓
   User Email    Payment Gateway      Inventory        Driver App     Tracking    Completion
```

### 🎯 RabbitMQ Topics
```
food_ordering.order.created        - New order placed
food_ordering.order.confirmed      - Order confirmed after payment  
food_ordering.order.cancelled      - Order cancellation
food_ordering.payment.successful   - Payment completed
food_ordering.payment.failed       - Payment failed
food_ordering.delivery.assigned    - Driver assigned
food_ordering.delivery.delivered   - Order delivered
```

## 🛠️ DevOps & Deployment

### 🐳 Docker Images
```bash
# Build all service images
docker build -t food-ordering/gateway:latest ./gateway
docker build -t food-ordering/user-service:latest ./user-service
docker build -t food-ordering/catalog-service:latest ./catalog-service
docker build -t food-ordering/order-service:latest ./order-service  
docker build -t food-ordering/payment-service:latest ./payment-service
docker build -t food-ordering/delivery-service:latest ./delivery-service
```

### ☸️ Kubernetes Deployment
```bash
# Create namespace and apply manifests
kubectl create namespace food-ordering
kubectl apply -f dev-infra/k8s/secrets.yaml
kubectl apply -f dev-infra/k8s/infrastructure.yaml
kubectl apply -f dev-infra/k8s/services.yaml

# Verify deployment
kubectl get pods -n food-ordering
kubectl get services -n food-ordering
```

### 📦 DockerHub Integration
```bash
# Tag and push to DockerHub (example with Gateway service)
docker tag food-ordering/gateway:latest yourusername/gateway:latest
docker push yourusername/gateway:latest
```

## 🧪 Testing Strategy

### ✅ Unit Testing (Structure Ready)
```bash
# Run unit tests for each service
cd user-service && npm test
cd catalog-service && npm test  
cd order-service && npm test
cd payment-service && npm test
cd gateway && npm test
cd delivery-service && python -m pytest
```

### 🔗 Integration Testing (Structure Ready)
- API endpoint testing with supertest/pytest
- Database integration testing
- Message queue integration testing
- gRPC service communication testing

### 🎭 End-to-End Testing (Implementation Ready)
- Complete user journey automation
- Cross-service communication validation
- Saga pattern compensation testing
- Load testing with realistic traffic patterns

## 🚨 Error Handling & Resilience

### ⚡ Circuit Breaker Pattern
```javascript
// Circuit Breaker Configuration
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,    // Open after 5 consecutive failures
  timeout: 60000,         // Timeout requests after 60 seconds
  resetTimeout: 30000,    // Try again after 30 seconds
  fallback: () => ({      // Fallback response
    status: 'error',
    message: 'Service temporarily unavailable'
  })
});
```

### 🔄 Saga Compensation
```javascript
// Example Saga Steps with Compensation
const orderSagaSteps = [
  { 
    action: 'reserveInventory', 
    compensation: 'releaseInventory' 
  },
  { 
    action: 'processPayment', 
    compensation: 'refundPayment' 
  },
  { 
    action: 'createDelivery', 
    compensation: 'cancelDelivery' 
  },
  { 
    action: 'sendConfirmation', 
    compensation: 'sendCancellation' 
  }
];
```

### 🛡️ Graceful Degradation
- **Service Fallbacks**: Cached responses when services are unavailable
- **Partial Functionality**: Core features continue during partial outages
- **User-Friendly Errors**: Clear error messages with recovery suggestions
- **Automatic Retry**: Exponential backoff for transient failures

## 📚 Documentation

### 📖 Available Documentation
- **README.md**: Complete project overview (this file)
- **API Documentation**: OpenAPI/Swagger specs for each service
- **Architecture Docs**: Service interaction diagrams and patterns
- **Deployment Guide**: Step-by-step deployment instructions
- **Testing Guide**: Testing strategies and automation

### 🔍 Code Documentation
- **Inline Comments**: Clear code documentation
- **JSDoc/PyDoc**: Function and class documentation
- **TypeScript Types**: Type definitions for enhanced code clarity
- **Protocol Buffers**: Well-documented gRPC service definitions

## 🏆 Project Achievements Summary

### ✅ **Requirements Fulfilled**
- **6 Microservices**: Gateway, User, Catalog, Order, Payment, Delivery ✅
- **Multiple Communication Protocols**: REST, GraphQL, gRPC, Message Queues ✅
- **5 Design Patterns**: API Gateway, Database-per-Service, Saga, CQRS, Circuit Breaker ✅
- **Containerization**: Docker images for all services ✅  
- **Orchestration**: Kubernetes manifests and deployment ✅
- **Message Broker**: RabbitMQ for event-driven architecture ✅
- **Documentation**: Comprehensive documentation and API specs ✅

### 🎯 **Technical Excellence**
- **Production-Ready**: Health checks, logging, monitoring
- **Security**: JWT authentication, input validation, container security
- **Scalability**: Horizontal scaling, caching, load balancing
- **Resilience**: Circuit breakers, saga compensation, graceful degradation
- **Testing**: Unit, integration, and e2e testing structure
- **DevOps**: Automated build and deployment scripts

### 📊 **Innovation & Best Practices**
- **Event Sourcing**: Order event history with replay capabilities
- **CQRS Implementation**: Optimized read/write separation  
- **gRPC Integration**: High-performance inter-service communication
- **Geospatial Features**: Location-based restaurant search
- **Real-time Updates**: WebSocket subscriptions for order tracking

## 🔗 Quick Access Links

### 🌐 **Service Endpoints** (Local Development)
| Service | HTTP | Additional | Documentation |
|---------|------|------------|---------------|
| Gateway | :3000 | GraphQL: /graphql | Playground: :3000/graphql |
| User | :3001 | JWT Auth | Swagger: :3001/docs |  
| Catalog | :3002 | Geospatial Search | Swagger: :3002/docs |
| Order | :3003 | CQRS + Saga | Swagger: :3003/docs |
| Payment | :3004 | gRPC: :50051 | Proto: payment.proto |
| Delivery | :3005 | Real-time Tracking | FastAPI: :3005/docs |

### ⚡ **Quick Commands**
```bash
# Start everything
./build-and-deploy.sh

# Health checks
curl http://localhost:3000/health

# GraphQL playground  
open http://localhost:3000/graphql

# View logs (Kubernetes)
kubectl logs -f deployment/gateway-service -n food-ordering

# Scale services
kubectl scale deployment gateway-service --replicas=3 -n food-ordering
```

---

## 📞 **Support & Contact**

**Project**: G10 Food Ordering Microservices Platform  
**Architecture**: Event-Driven Microservices with Multiple Communication Patterns  
**Tech Stack**: Node.js, Python, MongoDB, PostgreSQL, RabbitMQ, Docker, Kubernetes  
**Deployment**: Local, Docker Compose, Kubernetes (Minikube/Cloud)

For technical questions, deployment issues, or feature discussions, check the individual service documentation or examine the logs:

```bash
# Local development logs
docker-compose logs [service-name]

# Kubernetes deployment logs  
kubectl logs -f deployment/[service-name] -n food-ordering

# Service health status
kubectl get pods -n food-ordering
```

**🎉 This project demonstrates enterprise-grade microservices architecture with modern DevOps practices, ready for production deployment and scaling! 🚀**
# Delivery Service: http://localhost:3005
```

### Kubernetes Deployment
```bash
# Start Minikube
minikube start

# Deploy all services
kubectl apply -f dev-infra/k8s/

# Access via Minikube
minikube service gateway-service
```

## API Documentation

- **OpenAPI**: Available at each service endpoint `/docs`
- **GraphQL**: Gateway GraphQL playground at `/graphql`
- **gRPC**: Proto files in each service's `/proto` directory

## Testing

Each service includes:
- Unit tests
- Integration tests
- API contract tests

## Group Contributions

- **Member 1**: User Service, Authentication, Documentation
- **Member 2**: Catalog Service, Database Design
- **Member 3**: Order Service, Saga Pattern Implementation
- **Member 4**: Payment Service, gRPC Implementation
- **Member 5**: Delivery Service, Message Broker Integration
- **Member 6**: Gateway Service, Kubernetes Deployment

## Architecture Benefits

### Scalability
- Independent service scaling
- Database-per-service allows optimal database choices
- API Gateway enables caching and load balancing

### Resilience
- Circuit breaker prevents cascade failures
- Saga pattern ensures data consistency
- Message broker provides reliable async communication
- Independent deployments reduce system-wide failures

## License
MIT License