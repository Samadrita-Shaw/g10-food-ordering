#!/bin/bash
echo "=== Redeploying Payment Service ==="
cd /Users/I529021/g10-food-ordering/payment-service-springboot
mvn clean package -DskipTests
docker build -t food-ordering/payment-service:latest .
docker stop food-ordering-payment-service-springboot 2>/dev/null || true
docker rm food-ordering-payment-service-springboot 2>/dev/null || true
docker run -d \
  --name food-ordering-payment-service-springboot \
  --network dev-infra_food-ordering-network \
  --hostname payment-service \
  -p 8084:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  food-ordering/payment-service:latest
echo "Payment service redeployed. Checking logs..."
sleep 3
docker logs food-ordering-payment-service-springboot --tail 10

