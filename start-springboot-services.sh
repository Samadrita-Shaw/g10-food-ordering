#!/bin/bash

# Spring Boot Food Ordering System - Build and Deploy Script
echo "🍃 Building Spring Boot Food Ordering Microservices..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running, start if needed
if ! docker info &> /dev/null; then
    print_warning "Docker is not running. Starting Docker Desktop..."
    
    # Try to start Docker Desktop on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker
        print_status "Waiting for Docker Desktop to start..."
        
        # Wait for Docker to start (max 60 seconds)
        for i in {1..30}; do
            if docker info &> /dev/null; then
                print_status "✅ Docker is now running"
                break
            fi
            echo -n "."
            sleep 2
        done
        echo ""
        
        # Final check
        if ! docker info &> /dev/null; then
            print_error "Failed to start Docker. Please start Docker Desktop manually."
            exit 1
        fi
    else
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
fi

# Navigate to project root
cd "$(dirname "$0")"

print_status "Building Spring Boot services..."

# Build each Spring Boot service
services=(
    "user-service-springboot"
    "gateway-springboot" 
    "catalog-service-springboot"
    "order-service-springboot"
    "payment-service-springboot"
    "delivery-service-springboot"
)

failed_services=()

for service in "${services[@]}"; do
    print_status "Building $service..."
    
    if [ -d "$service" ]; then
        cd "$service"
        
        # Build with Maven (try mvnw first, fallback to mvn)
        if [ -f "./mvnw" ]; then
            chmod +x ./mvnw
            build_cmd="./mvnw clean package -DskipTests"
        else
            build_cmd="mvn clean package -DskipTests"
        fi
        
        if $build_cmd; then
            print_status "✅ $service built successfully"
        else
            print_error "❌ Failed to build $service"
            failed_services+=("$service")
        fi
        
        cd ..
    else
        print_warning "Directory $service not found, skipping..."
    fi
done

# Report build results
if [ ${#failed_services[@]} -eq 0 ]; then
    print_status "🎉 All Spring Boot services built successfully!"
    
    print_status "Starting infrastructure and services..."
    cd dev-infra
    
    # Start infrastructure services first
    print_status "Starting infrastructure services..."
    docker-compose up -d mongodb postgres rabbitmq redis
    
    # Wait for infrastructure to be ready
    print_status "Waiting for infrastructure services to be ready..."
    sleep 30
    
    # Start application services
    print_status "Starting Spring Boot application services..."
    docker-compose up -d
    
    # Show service status
    print_status "Service Status:"
    docker-compose ps
    
    print_status "🚀 Spring Boot Food Ordering System is starting up!"
    print_status "Services will be available at:"
    echo "  - Gateway Service: http://localhost:8080"
    echo "  - User Service: http://localhost:8081"
    echo "  - Catalog Service: http://localhost:8082" 
    echo "  - Order Service: http://localhost:8083"
    echo "  - Payment Service: http://localhost:8084"
    echo "  - Delivery Service: http://localhost:8085"
    echo ""
    print_status "Spring Boot Actuator Health checks:"
    echo "  - curl http://localhost:8080/actuator/health  # Gateway"
    echo "  - curl http://localhost:8081/actuator/health  # User Service"
    echo "  - curl http://localhost:8082/actuator/health  # Catalog Service"
    echo "  - curl http://localhost:8083/actuator/health  # Order Service"
    echo "  - curl http://localhost:8084/actuator/health  # Payment Service"
    echo "  - curl http://localhost:8085/actuator/health  # Delivery Service"
    echo ""
    print_status "Monitor logs with: docker-compose logs -f [service-name]"
    
else
    print_error "❌ Failed to build the following services:"
    for service in "${failed_services[@]}"; do
        echo "  - $service"
    done
    print_error "Please fix the build errors and try again."
    exit 1
fi