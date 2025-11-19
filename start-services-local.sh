#!/bin/bash

# 🚀 Start All Food Ordering Services Locally
# This script starts all microservices in local development mode

echo "🍔 Starting Food Ordering Microservices"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/I528972/Documents/g10-food-ordering"
cd "$BASE_DIR"

# Function to start a service
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    
    echo -e "${BLUE}🚀 Starting $service_name Service (Port $port)${NC}"
    
    if [ -d "$service_dir" ]; then
        cd "$BASE_DIR/$service_dir"
        
        # Install dependencies if package.json exists
        if [ -f "package.json" ]; then
            echo "  📦 Installing dependencies..."
            npm install --silent > /dev/null 2>&1
            
            echo "  🔥 Starting service..."
            # Start service in background
            SERVICE_NAME_LOWER=$(echo "$service_name" | tr '[:upper:]' '[:lower:]')
            npm start > "/tmp/${SERVICE_NAME_LOWER}-service.log" 2>&1 &
            SERVICE_PID=$!
            echo "  ✅ $service_name started (PID: $SERVICE_PID) - Logs: /tmp/${SERVICE_NAME_LOWER}-service.log"
            
        elif [ -f "requirements.txt" ]; then
            echo "  🐍 Installing Python dependencies..."
            pip install -r requirements.txt --quiet > /dev/null 2>&1
            
            echo "  🔥 Starting Python service..."
            # Start Python service in background
            SERVICE_NAME_LOWER=$(echo "$service_name" | tr '[:upper:]' '[:lower:]')
            python src/main.py > "/tmp/${SERVICE_NAME_LOWER}-service.log" 2>&1 &
            SERVICE_PID=$!
            echo "  ✅ $service_name started (PID: $SERVICE_PID) - Logs: /tmp/${SERVICE_NAME_LOWER}-service.log"
        else
            echo "  ❌ No package.json or requirements.txt found"
        fi
        
        # Wait a moment for service to start
        sleep 2
        
    else
        echo "  ❌ Directory $service_dir not found"
    fi
    echo ""
}

# Check if infrastructure is running
echo -e "${YELLOW}🔍 Checking infrastructure services...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep food-ordering
echo ""

# Start all microservices
start_service "Gateway" "gateway" "3000"
start_service "User" "user-service" "3001"
start_service "Catalog" "catalog-service" "3002"
start_service "Order" "order-service" "3003"
start_service "Payment" "payment-service" "3004"
start_service "Delivery" "delivery-service" "3005"

echo -e "${GREEN}🎉 All services started!${NC}"
echo ""
echo -e "${BLUE}📋 Service Status:${NC}"
echo "Gateway:   http://localhost:3000"
echo "User:      http://localhost:3001"
echo "Catalog:   http://localhost:3002"
echo "Order:     http://localhost:3003"
echo "Payment:   http://localhost:3004"
echo "Delivery:  http://localhost:3005"
echo ""
echo -e "${YELLOW}💡 To test APIs:${NC}"
echo "1. Wait 30 seconds for all services to fully start"
echo "2. Run: curl http://localhost:3000/health"
echo "3. Open Bruno and use the test collections"
echo ""
echo -e "${YELLOW}🛑 To stop services:${NC}"
echo "Run: pkill -f 'node.*src/index.js' && pkill -f 'python.*main.py'"