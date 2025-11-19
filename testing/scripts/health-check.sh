#!/bin/bash

# G10 Food Ordering - Health Check Script
# This script checks if all services are running and healthy

echo "🏥 G10 Food Ordering - Health Check"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service configurations
declare -A services=(
    ["Gateway"]="3000"
    ["User Service"]="3001"
    ["Catalog Service"]="3002"
    ["Order Service"]="3003"
    ["Payment Service"]="3004"
    ["Delivery Service"]="3005"
)

# Infrastructure services
declare -A infrastructure=(
    ["MongoDB"]="27017"
    ["PostgreSQL"]="5432"
    ["RabbitMQ Management"]="15672"
    ["Redis"]="6379"
)

passed=0
failed=0

# Function to test HTTP health endpoint
test_http_health() {
    local service_name="$1"
    local port="$2"
    local url="http://localhost:$port/health"
    
    echo -n "Testing $service_name ($port)... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        ((passed++))
    else
        echo -e "${RED}❌ UNHEALTHY (HTTP $response)${NC}"
        ((failed++))
    fi
}

# Function to test infrastructure services
test_infrastructure() {
    local service_name="$1"
    local port="$2"
    
    echo -n "Testing $service_name ($port)... "
    
    if nc -z localhost "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ RUNNING${NC}"
        ((passed++))
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
        ((failed++))
    fi
}

echo "🔍 Checking Infrastructure Services..."
echo "-----------------------------------"

for service in "${!infrastructure[@]}"; do
    test_infrastructure "$service" "${infrastructure[$service]}"
done

echo ""
echo "🔍 Checking Application Services..."
echo "--------------------------------"

for service in "${!services[@]}"; do
    test_http_health "$service" "${services[$service]}"
done

echo ""
echo "📊 Health Check Summary"
echo "====================="
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo -e "Total:  $((passed + failed))"

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some services are unhealthy!${NC}"
    echo ""
    echo "🔧 Troubleshooting tips:"
    echo "- Check if Docker containers are running: docker-compose ps"
    echo "- Check if Kubernetes pods are ready: kubectl get pods -n food-ordering"
    echo "- Review service logs: docker-compose logs [service-name]"
    echo "- Verify port forwarding for Kubernetes: kubectl port-forward service/gateway-service 3000:80"
    exit 1
fi