#!/bin/bash
echo "=== Redeploying All Services ==="

services=("user" "gateway" "catalog" "order" "payment" "delivery")

for service in "${services[@]}"; do
    echo "Redeploying $service service..."
    ./redeploy-${service}.sh
    echo "✅ $service service redeployed"
    echo "------------------------"
done

echo "=== All services redeployed! ==="
echo "Services status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep food-ordering
