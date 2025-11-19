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