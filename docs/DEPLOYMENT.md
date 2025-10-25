# Deployment Guide - Food Ordering Microservices

## Overview
This guide covers deploying the Food Ordering microservices application using Docker Compose for local development and Kubernetes for production deployment.

## Prerequisites

### Local Development
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Python 3.9+

### Production (Kubernetes)
- Minikube 1.25+ (for local Kubernetes cluster)
- kubectl 1.25+
- Docker registry access (DockerHub or AWS ECR)

## Local Development Deployment

### 1. Environment Setup

Clone the repository and navigate to the project directory:
```bash
git clone <repository-url>
cd g10-food-ordering
```

### 2. Build Services

Build all service images:
```bash
# Build Gateway Service
cd gateway
docker build -t food-ordering/gateway:latest .

# Build User Service
cd ../user-service
docker build -t food-ordering/user-service:latest .

# Build Order Service
cd ../order-service
docker build -t food-ordering/order-service:latest .

# Build Payment Service
cd ../payment-service
docker build -t food-ordering/payment-service:latest .

# Build Delivery Service
cd ../delivery-service
docker build -t food-ordering/delivery-service:latest .

# Build Catalog Service
cd ../catalog-service
docker build -t food-ordering/catalog-service:latest .
```

### 3. Start Infrastructure Services

Start the infrastructure services first:
```bash
cd dev-infra
docker-compose up -d mongodb postgres rabbitmq redis
```

Wait for services to be ready (check health):
```bash
# Check MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check PostgreSQL
docker-compose exec postgres psql -U admin -d food_ordering -c "SELECT 1;"

# Check RabbitMQ
curl -u admin:password http://localhost:15672/api/overview

# Check Redis
docker-compose exec redis redis-cli ping
```

### 4. Start Application Services

Start all application services:
```bash
docker-compose up -d
```

### 5. Verify Deployment

Check service health:
```bash
# Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Catalog Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health

# Payment Service
curl http://localhost:3004/health

# Delivery Service
curl http://localhost:3005/health
```

### 6. Access Services

- **API Gateway**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/graphql
- **RabbitMQ Management**: http://localhost:15672 (admin/password)
- **Direct Service Access**: Ports 3001-3005

---

## Production Deployment (Kubernetes)

### 1. Minikube Setup

Start Minikube cluster:
```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=20GB

# Enable required addons
minikube addons enable ingress
minikube addons enable dashboard

# Configure kubectl
kubectl config use-context minikube
```

### 2. Build and Push Images

#### Option A: Use Minikube Docker Environment
```bash
# Point shell to minikube's docker daemon
eval $(minikube docker-env)

# Build images directly in Minikube
cd gateway
docker build -t food-ordering/gateway:latest .

cd ../user-service
docker build -t food-ordering/user-service:latest .

# Repeat for all services...
```

#### Option B: Push to Docker Registry
```bash
# Tag images for registry
docker tag food-ordering/gateway:latest your-registry/food-ordering/gateway:latest
docker tag food-ordering/user-service:latest your-registry/food-ordering/user-service:latest
# ... repeat for all services

# Push to registry
docker push your-registry/food-ordering/gateway:latest
docker push your-registry/food-ordering/user-service:latest
# ... repeat for all services
```

### 3. Deploy Infrastructure

Apply infrastructure manifests:
```bash
cd dev-infra/k8s

# Create namespace and configuration
kubectl apply -f config.yaml

# Deploy infrastructure services
kubectl apply -f infrastructure.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n food-ordering
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n food-ordering
kubectl wait --for=condition=available --timeout=300s deployment/rabbitmq -n food-ordering
kubectl wait --for=condition=available --timeout=300s deployment/redis -n food-ordering
```

### 4. Deploy Application Services

Deploy microservices:
```bash
# Deploy application services
kubectl apply -f services.yaml

# Wait for services to be ready
kubectl wait --for=condition=available --timeout=300s deployment/gateway-service -n food-ordering
kubectl wait --for=condition=available --timeout=300s deployment/user-service -n food-ordering
kubectl wait --for=condition=available --timeout=300s deployment/order-service -n food-ordering
kubectl wait --for=condition=available --timeout=300s deployment/payment-service -n food-ordering
```

### 5. Verify Kubernetes Deployment

Check pod status:
```bash
kubectl get pods -n food-ordering
kubectl get services -n food-ordering
kubectl get deployments -n food-ordering
```

Check service health:
```bash
# Port forward to test services
kubectl port-forward service/gateway-service 3000:80 -n food-ordering &

# Test health endpoint
curl http://localhost:3000/health

# Check logs
kubectl logs -f deployment/gateway-service -n food-ordering
```

### 6. Access Application

#### Using Port Forwarding
```bash
# Gateway service
kubectl port-forward service/gateway-service 3000:80 -n food-ordering

# Access application at http://localhost:3000
```

#### Using Minikube Service
```bash
# Get Minikube service URL
minikube service gateway-service -n food-ordering --url

# Open in browser
minikube service gateway-service -n food-ordering
```

#### Using Ingress (Optional)
Create ingress resource:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: food-ordering-ingress
  namespace: food-ordering
spec:
  rules:
  - host: food-ordering.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway-service
            port:
              number: 80
```

Apply and configure:
```bash
kubectl apply -f ingress.yaml

# Add to /etc/hosts
echo "$(minikube ip) food-ordering.local" | sudo tee -a /etc/hosts

# Access at http://food-ordering.local
```

---

## Database Initialization

### PostgreSQL Schema
```bash
# Connect to PostgreSQL
kubectl exec -it deployment/postgres -n food-ordering -- psql -U admin -d food_ordering

# Create tables (run in Order and Payment services on startup)
CREATE TABLE IF NOT EXISTS orders (...);
CREATE TABLE IF NOT EXISTS payments (...);
```

### MongoDB Initialization
```bash
# Connect to MongoDB
kubectl exec -it deployment/mongodb -n food-ordering -- mongosh -u admin -p password

# Create indexes
use user_service;
db.users.createIndex({ "email": 1 }, { unique: true });

use catalog_service;
db.restaurants.createIndex({ "location": "2dsphere" });
```

---

## Monitoring and Troubleshooting

### Monitoring Commands
```bash
# Watch pod status
kubectl get pods -n food-ordering -w

# View resource usage
kubectl top pods -n food-ordering
kubectl top nodes

# Check events
kubectl get events -n food-ordering --sort-by='.lastTimestamp'
```

### Common Issues and Solutions

#### 1. Service Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n food-ordering

# Check logs
kubectl logs <pod-name> -n food-ordering

# Common issues:
# - Image pull errors: Check image names and registry access
# - Resource constraints: Increase CPU/memory limits
# - Configuration errors: Verify environment variables
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/user-service -n food-ordering -- nc -zv mongodb-service 27017
kubectl exec -it deployment/order-service -n food-ordering -- nc -zv postgres-service 5432

# Check database pod logs
kubectl logs deployment/mongodb -n food-ordering
kubectl logs deployment/postgres -n food-ordering
```

#### 3. Message Broker Issues
```bash
# Check RabbitMQ status
kubectl exec -it deployment/rabbitmq -n food-ordering -- rabbitmqctl status

# Test RabbitMQ connectivity
kubectl exec -it deployment/order-service -n food-ordering -- nc -zv rabbitmq-service 5672
```

### Health Checks
```bash
# Check all service health endpoints
for service in gateway-service user-service order-service payment-service; do
  echo "Checking $service..."
  kubectl exec -it deployment/$service -n food-ordering -- curl -f http://localhost:$(kubectl get service $service -n food-ordering -o jsonpath='{.spec.ports[0].targetPort}')/health
done
```

---

## Scaling

### Horizontal Pod Autoscaling
```bash
# Enable metrics server (if not available)
minikube addons enable metrics-server

# Create HPA for gateway service
kubectl autoscale deployment gateway-service --cpu-percent=50 --min=1 --max=10 -n food-ordering

# Check HPA status
kubectl get hpa -n food-ordering
```

### Manual Scaling
```bash
# Scale specific service
kubectl scale deployment/user-service --replicas=3 -n food-ordering

# Scale all services
for service in gateway-service user-service order-service payment-service; do
  kubectl scale deployment/$service --replicas=2 -n food-ordering
done
```

---

## Backup and Recovery

### Database Backup
```bash
# MongoDB backup
kubectl exec deployment/mongodb -n food-ordering -- mongodump --uri="mongodb://admin:password@localhost:27017/user_service?authSource=admin" --out=/tmp/backup

# PostgreSQL backup
kubectl exec deployment/postgres -n food-ordering -- pg_dump -U admin food_ordering > backup.sql
```

### Application Data Export
```bash
# Export Kubernetes resources
kubectl get all -n food-ordering -o yaml > food-ordering-backup.yaml
```

---

## Production Considerations

### Security
1. **Use Kubernetes Secrets** for sensitive data
2. **Enable RBAC** for service accounts
3. **Network Policies** for service isolation
4. **Pod Security Policies** for container security

### High Availability
1. **Multiple replicas** for each service
2. **Database clustering** for data persistence
3. **Load balancing** across availability zones
4. **Backup and disaster recovery** procedures

### Performance
1. **Resource limits** and requests
2. **Horizontal Pod Autoscaling**
3. **Database performance tuning**
4. **Caching strategies**

This deployment guide provides comprehensive instructions for both development and production environments, ensuring reliable and scalable deployment of the Food Ordering microservices application.