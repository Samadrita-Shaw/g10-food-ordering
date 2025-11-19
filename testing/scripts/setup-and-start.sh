#!/bin/bash

# G10 Food Ordering - Setup and Start Services
# This script sets up and starts all services for testing

echo "🚀 G10 Food Ordering - Service Setup & Startup"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking Prerequisites..."
echo "=========================="

# Check Docker
if command_exists docker; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
else
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check Docker Compose
if command_exists docker-compose; then
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
else
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose"
    exit 1
fi

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop"
    exit 1
fi

echo ""

# Check for port conflicts
echo "🔌 Checking Port Availability..."
echo "=============================="

ports=(3000 3001 3002 3003 3004 3005 5432 27017 5672 6379 15672)
conflicts=0

for port in "${ports[@]}"; do
    if port_in_use "$port"; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        ((conflicts++))
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
done

if [ $conflicts -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some ports are in use. Please stop conflicting services.${NC}"
    echo "You can check what's using a port with: lsof -i :PORT_NUMBER"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Start services
echo "🐳 Starting Services with Docker Compose..."
echo "=========================================="

# Navigate to dev-infra directory
cd dev-infra || {
    echo -e "${RED}❌ dev-infra directory not found${NC}"
    exit 1
}

# Stop any existing services
echo "Stopping any existing services..."
docker-compose down

# Start infrastructure services
echo "Starting infrastructure services..."
if docker-compose up -d; then
    echo -e "${GREEN}✅ Infrastructure services started${NC}"
else
    echo -e "${RED}❌ Failed to start infrastructure services${NC}"
    exit 1
fi

# Go back to root directory
cd ..

echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
echo "===================================="

# Function to wait for service to be healthy
wait_for_service() {
    local service_name="$1"
    local port="$2"
    local max_attempts=30
    local attempt=1
    
    echo -n "Waiting for $service_name (port $port)... "
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "${GREEN}Ready!${NC}"
            return 0
        fi
        
        sleep 2
        ((attempt++))
        echo -n "."
    done
    
    echo -e "${RED}Failed to start after $max_attempts attempts${NC}"
    return 1
}

# Wait for infrastructure services
wait_for_service "MongoDB" 27017
wait_for_service "PostgreSQL" 5432
wait_for_service "RabbitMQ" 5672
wait_for_service "Redis" 6379

echo ""

# Option to start application services
echo "🎯 Application Services Startup Options"
echo "======================================"
echo "1. Start all services with Docker (recommended for testing)"
echo "2. Manual startup instructions (for development)"
echo "3. Skip application services (infrastructure only)"

read -p "Choose option (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        echo "Starting all application services with Docker..."
        # This would require application services to be containerized
        echo -e "${YELLOW}Note: Application services need to be built first${NC}"
        echo "Run: ./build-and-deploy.sh"
        ;;
    2)
        echo -e "${BLUE}Manual Startup Instructions:${NC}"
        echo "============================================="
        echo ""
        echo "Open 6 separate terminals and run:"
        echo ""
        echo "Terminal 1 - Gateway Service:"
        echo "cd gateway && npm install && npm start"
        echo ""
        echo "Terminal 2 - User Service:"
        echo "cd user-service && npm install && npm start"
        echo ""
        echo "Terminal 3 - Catalog Service:"
        echo "cd catalog-service && npm install && npm start"
        echo ""
        echo "Terminal 4 - Order Service:"
        echo "cd order-service && npm install && npm start"
        echo ""
        echo "Terminal 5 - Payment Service:"
        echo "cd payment-service && npm install && npm start"
        echo ""
        echo "Terminal 6 - Delivery Service:"
        echo "cd delivery-service && pip install -r requirements.txt && python main.py"
        ;;
    3)
        echo "Infrastructure services are running. Application services skipped."
        ;;
    *)
        echo "Invalid option. Infrastructure services are running."
        ;;
esac

echo ""

# Display service URLs
echo "🌐 Service URLs"
echo "=============="
echo "Gateway:          http://localhost:3000"
echo "GraphQL:          http://localhost:3000/graphql"
echo "User Service:     http://localhost:3001"
echo "Catalog Service:  http://localhost:3002"
echo "Order Service:    http://localhost:3003"
echo "Payment Service:  http://localhost:3004"
echo "Delivery Service: http://localhost:3005"
echo ""
echo "Infrastructure:"
echo "MongoDB:          localhost:27017"
echo "PostgreSQL:       localhost:5432"
echo "RabbitMQ:         http://localhost:15672 (guest/guest)"
echo "Redis:            localhost:6379"

echo ""

# Display next steps
echo "📋 Next Steps"
echo "============"
echo "1. Verify all services are running:"
echo "   ./testing/scripts/health-check.sh"
echo ""
echo "2. Run comprehensive API tests:"
echo "   ./testing/scripts/run-all-tests.sh"
echo ""
echo "3. Use Bruno for interactive API testing:"
echo "   Open Bruno and import: ./testing/bruno-collections/"
echo ""
echo "4. Access GraphQL Playground:"
echo "   http://localhost:3000/graphql"
echo ""
echo "5. Monitor RabbitMQ:"
echo "   http://localhost:15672 (username: guest, password: guest)"

echo ""
echo -e "${GREEN}🎉 Setup complete! Infrastructure services are running.${NC}"