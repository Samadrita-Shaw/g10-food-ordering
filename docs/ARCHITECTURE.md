# Food Ordering Microservices Architecture

## System Architecture Overview

The Food Ordering application is built using a microservices architecture pattern, decomposed by business capabilities. Each service owns its data and business logic, communicating through well-defined APIs and events.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │   Admin Panel   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │  (GraphQL + REST Proxy)   │
                    │   - Authentication        │
                    │   - Rate Limiting         │
                    │   - Load Balancing        │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼──────┐          ┌───────▼──────┐          ┌───────▼──────┐
│ User Service │          │Catalog Service│         │Order Service │
│              │          │              │          │              │
│ - MongoDB    │          │ - MongoDB    │          │ - PostgreSQL │
│ - REST API   │          │ - REST API   │          │ - REST API   │
│ - Events     │          │ - Events     │          │ - Saga Pattern│
└──────────────┘          └──────────────┘          └───────┬──────┘
                                                            │
        ┌───────────────────────────────────────────────────┼─────────┐
        │                                                   │         │
┌───────▼──────┐                                    ┌───────▼──────┐  │
│Payment Service│                                   │Delivery Service│ │
│              │◄──────── gRPC ──────────────────── │              │  │
│ - PostgreSQL │                                    │ - MongoDB    │  │
│ - gRPC Server│                                    │ - REST API   │  │
│ - REST API   │                                    │ - Events     │  │
│ - Events     │                                    │ - Real-time  │  │
└──────────────┘                                    └──────────────┘  │
                                                                      │
                    ┌─────────────────────────────────────────────────┘
                    │
            ┌───────▼──────┐
            │ Message Broker│
            │  (RabbitMQ)   │
            │ - Event Bus   │
            │ - Pub/Sub     │
            │ - Reliability │
            └───────────────┘
```

## Service Details

### 1. API Gateway Service
- **Technology**: Node.js, Express, Apollo GraphQL
- **Purpose**: Single entry point, request routing, authentication
- **Patterns**: API Gateway, Circuit Breaker
- **Database**: Redis (caching)

### 2. User Service
- **Technology**: Node.js, Express, MongoDB
- **Purpose**: User management, authentication, profiles
- **Patterns**: Database-per-service
- **API**: REST

### 3. Catalog Service
- **Technology**: Node.js, Express, MongoDB
- **Purpose**: Restaurant and menu management
- **Patterns**: Database-per-service
- **API**: REST

### 4. Order Service
- **Technology**: Node.js, Express, PostgreSQL
- **Purpose**: Order processing, workflow orchestration
- **Patterns**: Saga (Choreography), Database-per-service
- **API**: REST

### 5. Payment Service
- **Technology**: Node.js, Express, PostgreSQL
- **Purpose**: Payment processing, transactions
- **Patterns**: Database-per-service
- **API**: REST + gRPC

### 6. Delivery Service
- **Technology**: Python, FastAPI, MongoDB
- **Purpose**: Delivery tracking, driver management
- **Patterns**: Database-per-service
- **API**: REST

## Communication Patterns

### Synchronous Communication
- **REST APIs**: Primary communication for CRUD operations
- **GraphQL**: Flexible data fetching through API Gateway
- **gRPC**: High-performance communication (Order ↔ Payment)

### Asynchronous Communication
- **Message Broker**: RabbitMQ for event-driven architecture
- **Event Types**:
  - `user.registered`
  - `order.created`
  - `payment.processed`
  - `delivery.assigned`

## Design Patterns Implementation

### 1. API Gateway Pattern
**Benefits:**
- Single entry point for all clients
- Cross-cutting concerns (auth, rate limiting, caching)
- Service discovery and load balancing
- Protocol translation (REST to GraphQL)

**Implementation:**
- Express.js with middleware pipeline
- Apollo Server for GraphQL
- Redis for caching and rate limiting
- JWT-based authentication

### 2. Database-per-Service Pattern
**Benefits:**
- Data isolation and independence
- Technology diversity (MongoDB, PostgreSQL)
- Independent scaling
- Fault isolation

**Implementation:**
- User Service: MongoDB (document store for profiles)
- Catalog Service: MongoDB (flexible menu structures)
- Order Service: PostgreSQL (ACID transactions)
- Payment Service: PostgreSQL (financial data consistency)
- Delivery Service: MongoDB (real-time location data)

### 3. Saga Pattern (Choreography)
**Benefits:**
- Distributed transaction management
- Eventual consistency
- Fault tolerance with compensation
- Loose coupling between services

**Implementation in Order Processing:**
```
Order Created → Validate Order → Process Payment → Notify Restaurant → Assign Delivery → Complete Order
     ↓              ↓                ↓                  ↓                ↓              ↓
   Events        Events           gRPC Call          Events           Events        Events
```

**Compensation Flow:**
If any step fails, compensation events are triggered in reverse order:
- Cancel Delivery → Cancel Restaurant Order → Refund Payment → Mark Order Failed

## Data Flow Examples

### Order Creation Flow
1. **Client** → API Gateway: Create Order (GraphQL/REST)
2. **Gateway** → Order Service: Validate and create order
3. **Order Service** → Payment Service: Process payment (gRPC)
4. **Order Service** → Message Broker: Publish `order.created` event
5. **Catalog Service** ← Message Broker: Update inventory
6. **Delivery Service** ← Message Broker: Assign driver
7. **User Service** ← Message Broker: Send notification

### Payment Processing (gRPC)
```protobuf
service PaymentService {
  rpc ProcessPayment(PaymentRequest) returns (PaymentResponse);
  rpc RefundPayment(RefundRequest) returns (RefundResponse);
}
```

## Scalability and Resilience Benefits

### Scalability
1. **Horizontal Scaling**: Each service can be scaled independently
2. **Database Optimization**: Different databases for different use cases
3. **Caching**: Redis at gateway level, service-level caching
4. **Load Balancing**: Multiple instances behind Kubernetes services

### Resilience
1. **Circuit Breaker**: Prevents cascade failures
2. **Saga Compensation**: Automatic rollback on failures
3. **Event-Driven**: Loose coupling reduces direct dependencies
4. **Health Checks**: Kubernetes probes for automatic recovery
5. **Graceful Degradation**: Services can operate independently

## Technology Justification

### Node.js for Most Services
- Excellent for I/O-intensive operations
- Rich ecosystem for web APIs
- Easy integration with MongoDB and PostgreSQL
- Strong community support

### Python for Delivery Service
- Excellent for real-time location processing
- Strong geospatial libraries
- FastAPI for high-performance APIs

### MongoDB for User/Catalog/Delivery
- Flexible schema for evolving user profiles
- Excellent for hierarchical menu structures
- Geospatial queries for delivery optimization

### PostgreSQL for Order/Payment
- ACID compliance for financial transactions
- Complex query support for analytics
- Reliable for critical business data

### RabbitMQ for Messaging
- Reliable message delivery
- Flexible routing patterns
- High availability support
- Easy integration with all services

## Security Considerations

1. **JWT Authentication**: Stateless, scalable authentication
2. **Service-to-Service**: Internal communication via secure networks
3. **Input Validation**: Joi schemas for request validation
4. **Rate Limiting**: Prevents abuse and DDoS
5. **Secrets Management**: Kubernetes secrets for sensitive data

## Monitoring and Observability

1. **Distributed Tracing**: Correlation IDs across services
2. **Centralized Logging**: Winston with structured logging
3. **Health Checks**: Kubernetes readiness/liveness probes
4. **Metrics**: Service-level metrics and dashboards

This architecture provides a robust, scalable, and maintainable foundation for the food ordering platform while demonstrating modern microservices best practices.