#!/bin/bash
echo "=== Redeploying Delivery Service ==="
cd /Users/I529021/g10-food-ordering/delivery-service-springboot
mvn clean package -DskipTests
docker build -t food-ordering/delivery-service:latest .
docker stop food-ordering-delivery-service-springboot 2>/dev/null || true
docker rm food-ordering-delivery-service-springboot 2>/dev/null || true
docker run -d \
  --name food-ordering-delivery-service-springboot \
  --network dev-infra_food-ordering-network \
  --hostname delivery-service \
  -p 8085:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  food-ordering/delivery-service:latest
echo "Delivery service redeployed. Checking logs..."
sleep 3
docker logs food-ordering-delivery-service-springboot --tail 10

