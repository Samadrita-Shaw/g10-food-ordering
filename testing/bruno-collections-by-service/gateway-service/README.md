# Gateway Service Bruno Collection

This Bruno collection provides comprehensive API testing for the Gateway Service, which acts as the main entry point for the Food Ordering microservices architecture.

## Test Coverage

### 1. Health & Status Tests
- **Health Check**: Verifies gateway service health endpoint
- **Gateway Info**: Tests actuator info endpoint

### 2. Route Testing
The gateway routes requests to the following microservices:
- **User Service**: `/api/users/**` → `http://user-service:8080`
- **Catalog Service**: `/api/restaurants/**`, `/api/catalog/**` → `http://catalog-service:8080`
- **Order Service**: `/api/orders/**` → `http://order-service:8080`
- **Payment Service**: `/api/payments/**` → `http://payment-service:8080`
- **Delivery Service**: `/api/deliveries/**` → `http://delivery-service:8080`

### 3. Advanced Features Testing
- **CORS Support**: Tests cross-origin request handling
- **Circuit Breaker**: Tests fallback mechanisms when services are down
- **Invalid Routes**: Verifies proper error handling for non-existent routes

## Environment Variables

The collection uses the following environment variables (configured in `environments/Local.bru`):

- `gateway_url`: Base URL for the gateway service (default: `http://localhost:8080`)
- `auth_token`: Authentication token (if required)

## Running the Tests

### Prerequisites
1. Ensure the gateway service is running on `localhost:8080`
2. Install Bruno API client
3. Import this collection into Bruno

### Test Execution
1. Open Bruno
2. Import the collection from this directory
3. Select the "Local" environment
4. Run individual tests or the entire collection

### Expected Results
- Gateway health checks should return `200 OK`
- Route tests may return:
  - `200`: Service is running and accessible
  - `503`: Service is down (circuit breaker activated)
  - `404`: Service endpoint not found
- CORS tests should return appropriate CORS headers
- Invalid route tests should return `404` or `503`

## Circuit Breaker Notes

The gateway includes circuit breaker patterns for resilience:
- When a downstream service is unavailable, the circuit breaker opens
- Fallback endpoints are configured for graceful degradation
- Monitor logs for circuit breaker state changes

## Troubleshooting

### Common Issues
1. **503 Service Unavailable**: Backend microservice is not running
2. **Connection Refused**: Gateway service is not running
3. **CORS Errors**: Check CORS configuration in gateway

### Debug Steps
1. Check gateway service logs: `docker logs food-ordering-gateway-springboot`
2. Verify backend services are running: `docker ps`
3. Test gateway health directly: `curl http://localhost:8080/actuator/health`

## Related Documentation
- See `../../../docs/SWAGGER_DOCUMENTATION.md` for API specifications
- See `../../BRUNO-TESTING-GUIDE.md` for general Bruno testing guidelines
- See `../../../DEPLOYMENT_GUIDE.md` for deployment instructions