#!/bin/bash
echo "=== Redeploying Catalog Service ==="
cd /Users/I529021/g10-food-ordering/catalog-service-springboot
mvn clean package -DskipTests
docker build -t food-ordering/catalog-service:latest .
docker stop food-ordering-catalog-service-springboot 2>/dev/null || true
docker rm food-ordering-catalog-service-springboot 2>/dev/null || true
docker run -d \
  --name food-ordering-catalog-service-springboot \
  --network dev-infra_food-ordering-network \
  -p 8082:8080 \
  -e SPRING_PROFILES_ACTIVE=docker \
  food-ordering/catalog-service:latest
echo "Catalog service redeployed. Checking logs..."
sleep 3
docker logs food-ordering-catalog-service-springboot --tail 10

