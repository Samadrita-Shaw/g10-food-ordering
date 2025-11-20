#!/bin/bash
echo "=== Testing All Services After Deployment ==="

services=(
    "Gateway:8080:/api/gateway/health"
    "User:8081:/api/users/health"
    "Catalog:8082:/api/restaurants/health"
    "Order:8083:/api/orders/health"
    "Payment:8084:/api/payments/health"
    "Delivery:8085:/api/delivery/health"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r name port endpoint <<< "$service_info"
    echo "Testing $name Service..."

    response=$(curl -s -w "%{http_code}" http://localhost${port}${endpoint} -o /dev/null)

    if [ "$response" = "200" ]; then
        echo "✅ $name Service is running (Port $port)"
    else
        echo "❌ $name Service failed (Port $port) - HTTP $response"
    fi
done

echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep food-ordering
