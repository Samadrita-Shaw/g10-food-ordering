#!/bin/bash
echo "=== Redeploying Gateway Service ==="
cd /Users/I529021/g10-food-ordering/gateway-springboot
mvn clean package -DskipTests
docker build -t food-ordering/gateway-service:latest .
docker stop food-ordering-gateway-springboot 2>/dev/null || true
docker rm food-ordering-gateway-springboot 2>/dev/null || true
docker run -d \
  --name food-ordering-gateway-springboot \
  --network dev-infra_food-ordering-network \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  food-ordering/gateway-service:latest
echo "Gateway service redeployed. Checking logs..."
sleep 3
docker logs food-ordering-gateway-springboot --tail 10

