const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Circuit Breaker Implementation
 * Prevents cascade failures in microservices architecture
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'CircuitBreaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    this.expectedError = options.expectedError || (() => false);

    // Circuit states
    this.CLOSED = 'CLOSED';     // Normal operation
    this.OPEN = 'OPEN';         // Circuit is open, requests fail fast
    this.HALF_OPEN = 'HALF_OPEN'; // Testing if service recovered

    this.state = this.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    this.successCount = 0;

    // Metrics for monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      circuitOpened: 0,
      lastFailureTime: null
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute(fn, ...args) {
    this.metrics.totalRequests++;

    // Check circuit state
    if (this.state === this.OPEN) {
      if (this.canAttemptReset()) {
        this.state = this.HALF_OPEN;
        logger.info(`Circuit breaker ${this.name} moving to HALF_OPEN state`);
      } else {
        const error = new Error(`Circuit breaker ${this.name} is OPEN`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
    }

    try {
      const result = await this.executeWithTimeout(fn, args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn, args) {
    const timeout = 5000; // 5 second timeout
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        this.metrics.timeouts++;
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });

    return Promise.race([
      fn.apply(this, args),
      timeoutPromise
    ]);
  }

  /**
   * Handle successful execution
   */
  onSuccess() {
    this.metrics.successfulRequests++;
    this.failureCount = 0;
    
    if (this.state === this.HALF_OPEN) {
      this.successCount++;
      
      // After 3 successful requests in HALF_OPEN, close the circuit
      if (this.successCount >= 3) {
        this.state = this.CLOSED;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.name} closed after successful recovery`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  onFailure(error) {
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = new Date();
    this.lastFailureTime = Date.now();
    
    // Don't count expected errors as failures
    if (this.expectedError(error)) {
      return;
    }

    this.failureCount++;
    
    if (this.state === this.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.openCircuit();
    }

    logger.warn(`Circuit breaker ${this.name} recorded failure ${this.failureCount}/${this.failureThreshold}`, {
      error: error.message,
      state: this.state
    });
  }

  /**
   * Open the circuit
   */
  openCircuit() {
    this.state = this.OPEN;
    this.nextAttempt = Date.now() + this.resetTimeout;
    this.successCount = 0;
    this.metrics.circuitOpened++;
    
    logger.error(`Circuit breaker ${this.name} opened due to ${this.failureCount} failures`);
  }

  /**
   * Check if we can attempt to reset the circuit
   */
  canAttemptReset() {
    return Date.now() >= this.nextAttempt;
  }

  /**
   * Get current circuit breaker state and metrics
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      nextAttempt: this.nextAttempt,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = this.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    
    logger.info(`Circuit breaker ${this.name} manually reset`);
  }

  /**
   * Get health status
   */
  isHealthy() {
    return this.state === this.CLOSED;
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Create or get a circuit breaker for a service
   */
  getBreaker(serviceName, options = {}) {
    if (!this.breakers.has(serviceName)) {
      const breaker = new CircuitBreaker({
        name: serviceName,
        ...options
      });
      this.breakers.set(serviceName, breaker);
      logger.info(`Created circuit breaker for service: ${serviceName}`);
    }
    return this.breakers.get(serviceName);
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(serviceName, fn, options = {}) {
    const breaker = this.getBreaker(serviceName, options);
    return breaker.execute(fn);
  }

  /**
   * Get status of all circuit breakers
   */
  getStatus() {
    const status = {};
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getState();
    }
    return status;
  }

  /**
   * Get health status of all services
   */
  getHealthStatus() {
    const health = {};
    for (const [name, breaker] of this.breakers) {
      health[name] = {
        healthy: breaker.isHealthy(),
        state: breaker.state,
        lastCheck: new Date().toISOString()
      };
    }
    return health;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    logger.info('Reset all circuit breakers');
  }

  /**
   * Reset specific circuit breaker
   */
  reset(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.reset();
      logger.info(`Reset circuit breaker for service: ${serviceName}`);
    }
  }
}

// Global circuit breaker manager instance
const circuitBreakerManager = new CircuitBreakerManager();

module.exports = {
  CircuitBreaker,
  CircuitBreakerManager,
  circuitBreakerManager
};