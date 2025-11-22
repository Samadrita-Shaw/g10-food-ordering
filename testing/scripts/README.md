# 🚀 G10 Food Ordering - Deployment Scripts

This folder contains deployment scripts for the G10 Food Ordering Spring Boot microservices.

## 📋 Available Scripts

### 🔄 `redeploy-all.sh` - Complete System Deployment
**The main deployment script** - Rebuilds and redeploys all services in the correct dependency order using docker-compose.

```bash
# Deploy all services
./redeploy-all.sh
```

**Features:**
- ✅ **Dependency-aware deployment**: Services deployed in correct order
- ✅ **Maven builds**: Clean package for each service with error handling
- ✅ **Docker Compose integration**: Uses existing docker-compose.yml
- ✅ **Health checks**: Validates each service after deployment
- ✅ **Comprehensive logging**: Detailed progress with colored output
- ✅ **Error handling**: Graceful failure handling with troubleshooting tips
- ✅ **Infrastructure management**: Starts MongoDB, PostgreSQL, Redis, RabbitMQ first

**Deployment Order:**
1. 🗄️ Infrastructure (MongoDB, PostgreSQL, Redis, RabbitMQ)
2. 👤 User Service (8081) - Authentication foundation
3. 🍽️ Catalog Service (8082) - Restaurant data
4. 💳 Payment Service (8084) - gRPC server
5. 📋 Order Service (8083) - Depends on Payment
6. 🚚 Delivery Service (8085) - Depends on Order events
7. 🌐 Gateway Service (8080) - Routes to all services

### 📊 `status-check.sh` - Quick Health Check
**Service health monitor** - Quickly checks the status of all services and infrastructure.

```bash
# Check service status
./status-check.sh
```

**Output:**
- ✅ Service health status (all ports)
- ✅ Infrastructure status (MongoDB, PostgreSQL, etc.)
- ✅ Docker container status
- ✅ Quick test commands
- ✅ Management commands

### 🔧 Individual Service Scripts
Legacy individual deployment scripts for specific services:
- `redeploy-user.sh` - User Service only
- `redeploy-catalog.sh` - Catalog Service only
- `redeploy-order.sh` - Order Service only
- `redeploy-payment.sh` - Payment Service only
- `redeploy-delivery.sh` - Delivery Service only
- `redeploy-gateway.sh` - Gateway Service only

> **Note**: These scripts use standalone Docker commands and may have path issues. Use `redeploy-all.sh` for reliable deployment.

## 🎯 Usage Examples

### Complete System Deployment
```bash
# Navigate to scripts folder
cd testing/scripts

# Deploy all services
./redeploy-all.sh

# Check deployment status
./status-check.sh
```

### Troubleshooting
```bash
# Check what's running
./status-check.sh

# View logs for specific service
cd ../../dev-infra
docker-compose logs user-service

# Restart infrastructure if needed
docker-compose restart mongodb postgres redis rabbitmq

# Redeploy everything
cd ../testing/scripts
./redeploy-all.sh
```

## 🚀 Integration with Testing

After successful deployment, run the test suite:

```bash
# Run Bruno API tests
cd ../
./run-spring-boot-tests.sh

# Or run individual service tests
cd bruno-collections-by-service/user-service
bru run . --env local
```

## 🛡️ Error Handling

The `redeploy-all.sh` script includes:
- **Prerequisite checks**: Maven, Docker, Docker Compose, curl
- **Build validation**: Maven compilation before deployment
- **Health verification**: Service health checks after deployment
- **Failure recovery**: Detailed error messages and troubleshooting tips
- **Clean shutdown**: Graceful handling of interruptions

## 📊 Expected Output

### Successful Deployment:
```
🚀 G10 Food Ordering - Complete Redeploy All Services
====================================================

[12:34:56] Starting infrastructure services...
✅ Infrastructure services started

[12:35:02] 🔄 Deploying User Service
✅ User Service built successfully
✅ User Service is healthy on port 8081
✅ User Service deployment completed successfully!

[... continues for all services ...]

╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                              DEPLOYMENT SUMMARY                                                                                                                                           ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

✅ ALL SERVICES DEPLOYED SUCCESSFULLY!

🌐 Service URLs:
  • Gateway Service:    http://localhost:8080
  • User Service:       http://localhost:8081
  • Catalog Service:    http://localhost:8082
  • Order Service:      http://localhost:8083
  • Payment Service:    http://localhost:8084
  • Delivery Service:   http://localhost:8085
```

## 🔗 Related Documentation

- [Bruno Testing Guide](../BRUNO-TESTING-GUIDE.md)
- [System Architecture](../../docs/SYSTEM-ARCHITECTURE-FLOW.md)
- [Main README](../../README.md)

---

**Last Updated**: November 22, 2025  
**Version**: 2.0.0  
**Team**: G10 Food Ordering Development Team