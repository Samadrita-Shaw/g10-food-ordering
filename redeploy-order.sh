#!/bin/bash
echo "=== Redeploying Order Service ==="
cd /Users/I529021/g10-food-ordering/order-service-springboot
mvn clean package -DskipTests
docker build -t food-ordering/order-service:latest .
docker stop food-ordering-order-service-springboot 2>/dev/null || true
docker rm food-ordering-order-service-springboot 2>/dev/null || true
docker run -d \
  --name food-ordering-order-service-springboot \
  --network dev-infra_food-ordering-network \
  -p 8083:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  food-ordering/order-service:latest
echo "Order service redeployed. Checking logs..."
sleep 3
docker logs food-ordering-order-service-springboot --tail 10

