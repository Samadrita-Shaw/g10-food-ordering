#!/bin/bash

# Food Ordering Microservices Build and Deploy Script
set -e

echo "🏗️  Building Food Ordering Microservices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not running"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v minikube &> /dev/null; then
        print_warning "Minikube not found. Install with: brew install minikube"
        echo "Continuing with Docker build only..."
    fi
    
    print_status "Prerequisites checked"
}

# Build Docker images
build_images() {
    echo "🐳 Building Docker images..."
    
    # Gateway Service
    echo "Building Gateway Service..."
    cd gateway-springboot
    docker build -t food-ordering/gateway:latest .
    cd ..
    
    # User Service
    echo "Building User Service..."
    cd user-service-springboot
    docker build -t food-ordering/user-service:latest .
    cd ..
    
    # Catalog Service
    echo "Building Catalog Service..."
    cd catalog-service-springboot
    docker build -t food-ordering/catalog-service:latest .
    cd ..
    
    # Order Service
    echo "Building Order Service..."
    cd order-service-springboot
    docker build -t food-ordering/order-service:latest .
    cd ..
    
    # Payment Service
    echo "Building Payment Service..."
    cd payment-service-springboot
    docker build -t food-ordering/payment-service:latest .
    cd ..
    
    # Delivery Service
    echo "Building Delivery Service..."
    cd delivery-service-springboot
    docker build -t food-ordering/delivery-service:latest .
    cd ..
    
    print_status "All images built successfully"
}

# Push to DockerHub (optional)
push_to_dockerhub() {
    if [ "$1" = "--push" ]; then
        echo "📤 Pushing images to DockerHub..."
        
        # Tag for DockerHub (replace with your DockerHub username)
        DOCKERHUB_USER=${DOCKERHUB_USER:-"foodordering"}
        
        echo "Tagging images for DockerHub user: $DOCKERHUB_USER"
        
        docker tag food-ordering/gateway:latest $DOCKERHUB_USER/gateway:latest
        docker tag food-ordering/user-service:latest $DOCKERHUB_USER/user-service:latest
        docker tag food-ordering/catalog-service:latest $DOCKERHUB_USER/catalog-service:latest
        docker tag food-ordering/order-service:latest $DOCKERHUB_USER/order-service:latest
        docker tag food-ordering/payment-service:latest $DOCKERHUB_USER/payment-service:latest
        docker tag food-ordering/delivery-service:latest $DOCKERHUB_USER/delivery-service:latest
        
        # Push Gateway service as required
        echo "Pushing Gateway service to DockerHub..."
        docker push $DOCKERHUB_USER/gateway:latest
        
        print_status "Gateway image pushed to DockerHub"
        echo "ℹ️  To push all images, run: docker push $DOCKERHUB_USER/<service-name>:latest"
    fi
}

# Start Minikube and deploy
deploy_to_minikube() {
    if command -v minikube &> /dev/null; then
        echo "🚀 Deploying to Minikube..."
        
        # Start Minikube if not running
        if ! minikube status | grep -q "Running"; then
            echo "Starting Minikube..."
            minikube start
        fi
        
        # Set Docker environment to Minikube
        eval $(minikube docker-env)
        
        # Rebuild images in Minikube environment
        echo "Rebuilding images in Minikube environment..."
        build_images
        
        # Create namespace
        kubectl create namespace food-ordering --dry-run=client -o yaml | kubectl apply -f -
        
        # Apply Kubernetes manifests
        echo "Applying Kubernetes manifests..."
        cd dev-infra/k8s
        
        # Apply in order
        kubectl apply -f namespace.yaml
        kubectl apply -f secrets.yaml
        kubectl apply -f infrastructure.yaml
        kubectl apply -f services.yaml
        
        cd ../..
        
        # Wait for deployments
        echo "Waiting for deployments to be ready..."
        kubectl wait --for=condition=available --timeout=300s deployment --all -n food-ordering
        
        # Get service URLs
        echo "🌐 Getting service URLs..."
        minikube service gateway-service -n food-ordering --url
        
        print_status "Deployment completed successfully"
        
        # Show status
        kubectl get pods -n food-ordering
        kubectl get services -n food-ordering
        
    else
        print_warning "Minikube not available. Skipping deployment."
    fi
}

# Run tests
run_tests() {
    echo "🧪 Running basic health checks..."
    
    # Check if images exist
    docker images | grep food-ordering
    
    print_status "Build verification completed"
}

# Main execution
main() {
    echo "🍕 Food Ordering Microservices Deployment"
    echo "=========================================="
    
    check_prerequisites
    build_images
    push_to_dockerhub $1
    deploy_to_minikube
    run_tests
    
    echo ""
    echo "🎉 Deployment process completed!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Access the API Gateway at: http://localhost:80 (if deployed to Minikube)"
    echo "2. Check pod status: kubectl get pods -n food-ordering"
    echo "3. View logs: kubectl logs -f deployment/<service-name> -n food-ordering"
    echo "4. Access Minikube dashboard: minikube dashboard"
    echo ""
    echo "📚 API Documentation available at:"
    echo "- Gateway GraphQL Playground: http://gateway-url/graphql"
    echo "- Gateway REST API: http://gateway-url/api/docs"
    echo "- Delivery Service Docs: http://delivery-url/docs"
}

# Execute main function with all arguments
main "$@"