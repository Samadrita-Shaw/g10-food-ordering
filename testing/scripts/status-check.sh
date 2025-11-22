#!/bin/bash

# G10 Food Ordering - Quick Status Check
# This script quickly checks the health of all deployed services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}📊 G10 Food Ordering - Service Status Check${NC}"
echo -e "${CYAN}===========================================${NC}"
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local port=$2
    local url="http://localhost:$port/actuator/health"
    
    printf "%-18s " "$service_name:"
    
    if curl -s -f "$url" --max-time 3 >/dev/null 2>&1; then
        local response=$(curl -s "$url" --max-time 3 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$response" = "UP" ]; then
            echo -e "${GREEN}✅ HEALTHY${NC} (Port: $port)"
        else
            echo -e "${YELLOW}⚠️  RUNNING${NC} (Port: $port, Status: $response)"
        fi
    else
        echo -e "${RED}❌ DOWN${NC} (Port: $port)"
    fi
}

# Check all services
echo -e "${BLUE}🔍 Spring Boot Services:${NC}"
check_service "Gateway" "8080"
check_service "User Service" "8081"
check_service "Catalog Service" "8082"
check_service "Order Service" "8083"
check_service "Payment Service" "8084"
check_service "Delivery Service" "8085"

echo ""
echo -e "${BLUE}🗄️ Infrastructure:${NC}"

# Get project root (two levels up from testing/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check Docker containers if docker is available
if command -v docker >/dev/null 2>&1; then
    cd "$PROJECT_ROOT/dev-infra" 2>/dev/null || true
    
    # Check if docker-compose is in current directory
    if [[ -f "docker-compose.yml" ]]; then
        running_containers=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
        total_containers=$(docker-compose ps --services 2>/dev/null | wc -l)
        echo -e "Docker Services:   ${GREEN}$running_containers/$total_containers running${NC}"
        
        # Check specific infrastructure services
        printf "%-18s " "MongoDB:"
        if docker-compose ps mongodb | grep -q "Up"; then
            echo -e "${GREEN}✅ RUNNING${NC}"
        else
            echo -e "${RED}❌ DOWN${NC}"
        fi
        
        printf "%-18s " "PostgreSQL:"
        if docker-compose ps postgres | grep -q "Up"; then
            echo -e "${GREEN}✅ RUNNING${NC}"
        else
            echo -e "${RED}❌ DOWN${NC}"
        fi
        
        printf "%-18s " "Redis:"
        if docker-compose ps redis | grep -q "Up"; then
            echo -e "${GREEN}✅ RUNNING${NC}"
        else
            echo -e "${RED}❌ DOWN${NC}"
        fi
        
        printf "%-18s " "RabbitMQ:"
        if docker-compose ps rabbitmq | grep -q "Up"; then
            echo -e "${GREEN}✅ RUNNING${NC}"
        else
            echo -e "${RED}❌ DOWN${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  docker-compose.yml not found${NC}"
    fi
else
    echo -e "${RED}❌ Docker not available${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Quick Tests:${NC}"
echo "curl http://localhost:8080/actuator/health  # Gateway health"
echo "curl http://localhost:8081/actuator/health  # User service health"
echo "curl http://localhost:8082/api/restaurants  # List restaurants"

echo ""
echo -e "${BLUE}🔧 Management:${NC}"
echo "./redeploy-all.sh                          # Redeploy all services"
echo "cd ../../dev-infra && docker-compose logs   # View all logs"
echo "cd ../../ && ./validate-springboot-setup.sh # Full validation"