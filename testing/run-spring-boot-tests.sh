#!/bin/bash

echo "🧪 G10 Food Ordering - Spring Boot API Test Suite"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test execution order
TESTS=(
    "01-health-checks-all.bru"
    "02-user-registration.bru"
    "03-user-login.bru"
    "04-user-profile.bru"
    "05-get-restaurants.bru"
    "05-create-restaurant.bru"
    "07-create-order.bru"
    "08-get-order-details.bru"
    "09-process-payment.bru"
    "10-delivery-tracking.bru"
    "11-gateway-routing.bru"
    "12-error-handling.bru"
)

# Base URL for testing
BASE_URL="http://localhost:8080"

echo -e "${BLUE}📋 Test Plan:${NC}"
echo "1. Health Checks - All Spring Boot Services"
echo "2. User Management - Registration, Login, Profile"
echo "3. Catalog Management - Restaurants and Menus"
echo "4. Order Processing - Create and Retrieve Orders"
echo "5. Payment Processing - Process Payments"
echo "6. Delivery Tracking - Create and Track Deliveries"
echo "7. Gateway Routing - Test Spring Cloud Gateway"
echo "8. Error Handling - Validation and Edge Cases"

echo -e "\n${YELLOW}⚡ Prerequisites:${NC}"
echo "1. Docker Desktop running"
echo "2. Spring Boot services deployed: ./start-springboot-services.sh"
echo "3. Bruno CLI installed: npm install -g @usebruno/cli"

echo -e "\n${BLUE}🚀 Starting Test Execution...${NC}"

# Check if Bruno CLI is available
if ! command -v bru &> /dev/null; then
    echo -e "${RED}❌ Bruno CLI not found. Please install: npm install -g @usebruno/cli${NC}"
    exit 1
fi

# Check if services are running
echo -e "\n${YELLOW}🔍 Checking service availability...${NC}"

SERVICES=(
    "8080:Gateway"
    "8081:User Service"
    "8082:Catalog Service"
    "8083:Order Service"
    "8084:Payment Service"
    "8085:Delivery Service"
)

for service in "${SERVICES[@]}"; do
    IFS=':' read -r port name <<< "$service"
    if curl -s -f "http://localhost:$port/actuator/health" > /dev/null; then
        echo -e "${GREEN}✅ $name (Port $port) - Running${NC}"
    else
        echo -e "${RED}❌ $name (Port $port) - Not accessible${NC}"
        echo -e "${YELLOW}⚠️  Make sure to run: ./start-springboot-services.sh${NC}"
    fi
done

echo -e "\n${BLUE}🧪 Running API Tests...${NC}"

# Change to bruno collections directory
cd "$(dirname "$0")/bruno-collections" || exit

# Run tests in sequence
PASSED_TESTS=0
FAILED_TESTS=0

for test in "${TESTS[@]}"; do
    if [ -f "$test" ]; then
        echo -e "\n${BLUE}Running: $test${NC}"
        
        if bru run "$test" --env "local" --output table; then
            echo -e "${GREEN}✅ PASSED: $test${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}❌ FAILED: $test${NC}"
            ((FAILED_TESTS++))
        fi
    else
        echo -e "${YELLOW}⚠️  SKIPPED: $test (file not found)${NC}"
    fi
done

echo -e "\n${BLUE}📊 Test Summary:${NC}"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $FAILED_TESTS${NC}"

TOTAL_TESTS=$((PASSED_TESTS + FAILED_TESTS))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "${BLUE}📈 Success Rate: $SUCCESS_RATE%${NC}"
fi

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Spring Boot API is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}💥 Some tests failed. Please check the services and try again.${NC}"
    exit 1
fi