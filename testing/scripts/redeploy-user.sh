#!/bin/bash
echo "=== Redeploying User Service ==="
cd /Users/I529021/g10-food-ordering/user-service-springboot
mvn clean package -DskipTests
docker build -t food-ordering/user-service:latest .
docker stop food-ordering-user-service-springboot 2>/dev/null || true
docker rm food-ordering-user-service-springboot 2>/dev/null || true
docker run -d \
  --name food-ordering-user-service-springboot \
  --network dev-infra_food-ordering-network \
  --hostname user-service \
  -p 8081:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  food-ordering/user-service:latest
echo "User service redeployed. Checking logs..."
sleep 3
docker logs food-ordering-user-service-springboot --tail 10

