#!/bin/bash

# Update all Spring Boot service Dockerfiles to use pre-built JARs

services=(
    "user-service-springboot"
    "catalog-service-springboot"
    "order-service-springboot"
    "payment-service-springboot"
    "delivery-service-springboot"
)

for service in "${services[@]}"; do
    cat > "$service/Dockerfile" << 'EOF'
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the pre-built JAR file
COPY target/*.jar app.jar

# Expose port
EXPOSE 8080

# Add a non-root user for security
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF
    echo "Updated Dockerfile for $service"
done

echo "All Dockerfiles updated successfully!"