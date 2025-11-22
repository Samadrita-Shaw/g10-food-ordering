#!/bin/bash

# G10 Food Ordering - Complete Redeploy All Services
# This script rebuilds and redeploys all Spring Boot microservices using docker-compose

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the project root directory (two levels up from testing/scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${CYAN}🚀 G10 Food Ordering - Complete Redeploy All Services${NC}"
echo -e "${CYAN}====================================================${NC}"
echo -e "Project Root: ${PROJECT_ROOT}"
echo -e "Script Location: ${SCRIPT_DIR}"
echo ""

# Function to print status with timestamp
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Function to check if service is running and healthy
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be healthy on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:$port/actuator/health" --max-time 3 >/dev/null 2>&1; then
            local health_response=$(curl -s "http://localhost:$port/actuator/health" --max-time 3 2>/dev/null)
            if echo "$health_response" | grep -q '"status":"UP"'; then
                print_success "$service_name is healthy on port $port"
                return 0
            fi
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            echo -e "${YELLOW}Still waiting for $service_name... (attempt $attempt/$max_attempts)${NC}"
        else
            echo -n "."
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to become healthy on port $port"
    return 1
}

# Function to build a service with Maven
build_service() {
    local service_name=$1
    local service_dir=$2
    
    print_status "Building $service_name with Maven..."
    
    cd "$PROJECT_ROOT/$service_dir" || {
        print_error "Failed to navigate to $service_dir"
        return 1
    }
    
    if mvn clean package -DskipTests -q; then
        print_success "$service_name built successfully"
        return 0
    else
        print_error "Maven build failed for $service_name"
        return 1
    fi
}

# Function to deploy service using docker-compose
deploy_service() {
    local service_name=$1
    local docker_service_name=$2
    local port=$3
    
    print_status "Deploying $service_name using docker-compose..."
    
    cd "$PROJECT_ROOT/dev-infra" || {
        print_error "Failed to navigate to dev-infra directory"
        return 1
    }
    
    # Stop existing service
    print_status "Stopping existing $service_name..."
    docker-compose stop "$docker_service_name" 2>/dev/null || true
    docker-compose rm -f "$docker_service_name" 2>/dev/null || true
    
    # Build and start service
    if docker-compose up --build -d "$docker_service_name"; then
        print_success "$service_name container started"
        
        # Check health
        if check_service_health "$service_name" "$port"; then
            return 0
        else
            print_error "$service_name failed health check"
            return 1
        fi
    else
        print_error "Failed to start $service_name container"
        return 1
    fi
}

# Function to show service logs on failure
show_service_logs() {
    local docker_service_name=$1
    print_warning "Showing last 20 lines of logs for $docker_service_name:"
    cd "$PROJECT_ROOT/dev-infra"
    docker-compose logs --tail=20 "$docker_service_name"
    echo ""
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    local failed_services=()
    local successful_services=()
    
    print_info "Starting complete system redeploy..."
    echo ""
    
    # Verify project structure
    if [[ ! -d "$PROJECT_ROOT/dev-infra" ]]; then
        print_error "dev-infra directory not found at $PROJECT_ROOT/dev-infra"
        exit 1
    fi
    
    if [[ ! -f "$PROJECT_ROOT/dev-infra/docker-compose.yml" ]]; then
        print_error "docker-compose.yml not found in dev-infra directory"
        exit 1
    fi
    
    # Start infrastructure services first
    print_status "Starting infrastructure services (MongoDB, PostgreSQL, Redis, RabbitMQ)..."
    cd "$PROJECT_ROOT/dev-infra"
    docker-compose up -d mongodb postgres redis rabbitmq
    sleep 5
    print_success "Infrastructure services started"
    echo ""
    
    # Define services in dependency order
    declare -a services=(
        "User Service:user-service-springboot:user-service:8081"
        "Catalog Service:catalog-service-springboot:catalog-service:8082"
        "Payment Service:payment-service-springboot:payment-service:8084"
        "Order Service:order-service-springboot:order-service:8083"
        "Delivery Service:delivery-service-springboot:delivery-service:8085"
        "Gateway Service:gateway-springboot:gateway:8080"
    )
    
    print_info "Deployment sequence (dependency-aware order):"
    for i in "${!services[@]}"; do
        IFS=':' read -ra SERVICE_INFO <<< "${services[$i]}"
        echo "$((i+1)). ${SERVICE_INFO[0]} (${SERVICE_INFO[3]})"
    done
    echo ""
    
    # Deploy each service
    for service_config in "${services[@]}"; do
        IFS=':' read -ra SERVICE_INFO <<< "$service_config"
        local service_name="${SERVICE_INFO[0]}"
        local service_dir="${SERVICE_INFO[1]}"
        local docker_service="${SERVICE_INFO[2]}"
        local port="${SERVICE_INFO[3]}"
        
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        print_status "🔄 Deploying $service_name"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # Build service
        if build_service "$service_name" "$service_dir"; then
            # Deploy service
            if deploy_service "$service_name" "$docker_service" "$port"; then
                successful_services+=("$service_name")
                print_success "$service_name deployment completed successfully!"
            else
                failed_services+=("$service_name")
                show_service_logs "$docker_service"
            fi
        else
            failed_services+=("$service_name")
            print_error "$service_name build failed - skipping deployment"
        fi
        
        echo ""
    done
    
    # Final status report
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                              DEPLOYMENT SUMMARY                                                                                                                                           ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_info "Total deployment time: ${duration} seconds"
    echo ""
    
    if [ ${#successful_services[@]} -gt 0 ]; then
        print_success "Successfully deployed services (${#successful_services[@]}):"
        for service in "${successful_services[@]}"; do
            echo -e "${GREEN}  ✅ $service${NC}"
        done
        echo ""
    fi
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        print_error "Failed deployments (${#failed_services[@]}):"
        for service in "${failed_services[@]}"; do
            echo -e "${RED}  ❌ $service${NC}"
        done
        echo ""
        
        print_warning "Troubleshooting failed deployments:"
        echo -e "${YELLOW}• Check logs: cd dev-infra && docker-compose logs [service-name]${NC}"
        echo -e "${YELLOW}• Verify build: cd [service-dir] && mvn clean compile${NC}"
        echo -e "${YELLOW}• Check ports: netstat -tulpn | grep [port]${NC}"
        echo -e "${YELLOW}• Restart infra: cd dev-infra && docker-compose restart${NC}"
        echo ""
        exit 1
    fi
    
    # All services deployed successfully
    print_success "🎉 ALL SERVICES DEPLOYED SUCCESSFULLY!"
    echo ""
    
    echo -e "${GREEN}🌐 Service URLs:${NC}"
    echo "  • Gateway Service:    http://localhost:8080"
    echo "  • User Service:       http://localhost:8081"
    echo "  • Catalog Service:    http://localhost:8082"
    echo "  • Order Service:      http://localhost:8083"
    echo "  • Payment Service:    http://localhost:8084"
    echo "  • Delivery Service:   http://localhost:8085"
    echo ""
    
    echo -e "${GREEN}🧪 Test the deployment:${NC}"
    echo "  cd $PROJECT_ROOT/testing && ./run-spring-boot-tests.sh"
    echo ""
    
    echo -e "${GREEN}📊 Check service health:${NC}"
    echo "  $PROJECT_ROOT/validate-springboot-setup.sh"
    echo ""
    
    echo -e "${GREEN}🔍 View service logs:${NC}"
    echo "  cd $PROJECT_ROOT/dev-infra && docker-compose logs -f [service-name]"
    
    print_success "Deployment completed successfully in ${duration} seconds! 🚀"
}

# Handle script interruption
cleanup() {
    print_warning "Deployment interrupted! Services may be in an inconsistent state."
    print_info "To recover, run the script again or check individual service status."
    exit 1
}

trap cleanup INT TERM

# Check prerequisites
check_prerequisites() {
    local missing_tools=()
    
    if ! command -v mvn >/dev/null 2>&1; then
        missing_tools+=("Maven")
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        missing_tools+=("Docker")
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        missing_tools+=("Docker Compose")
    fi
    
    if ! command -v curl >/dev/null 2>&1; then
        missing_tools+=("curl")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo -e "${RED}  • $tool${NC}"
        done
        echo ""
        print_info "Please install missing tools and try again."
        exit 1
    fi
}

# Run prerequisite checks and main deployment
print_status "Checking prerequisites..."
check_prerequisites
print_success "All prerequisites available"
echo ""

main "$@"