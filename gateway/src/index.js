const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { ApolloServer } = require('apollo-server-express');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const { circuitBreakerManager } = require('./utils/circuitBreaker');
require('dotenv').config();

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'gateway.log' })
  ]
});

// GraphQL schema and resolvers
const { typeDefs, resolvers } = require('./graphql');

class APIGateway {
  constructor() {
    this.app = express();
    this.redisClient = null;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupGraphQL();
  }

  async setupRedis() {
    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed:', error);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use(limiter);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // JSON parsing
    this.app.use(express.json());
  }

  // Authentication middleware
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  }

  setupRoutes() {
    // Health check with circuit breaker status
    this.app.get('/health', (req, res) => {
      const circuitStatus = circuitBreakerManager.getHealthStatus();
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        circuitBreakers: circuitStatus
      });
    });

    // Circuit breaker status endpoint
    this.app.get('/circuit-breakers', (req, res) => {
      res.json(circuitBreakerManager.getStatus());
    });

    // Reset circuit breaker endpoint
    this.app.post('/circuit-breakers/:service/reset', (req, res) => {
      const { service } = req.params;
      circuitBreakerManager.reset(service);
      res.json({ message: `Circuit breaker for ${service} has been reset` });
    });

    // Service discovery endpoint
    this.app.get('/services', (req, res) => {
      res.json({
        services: {
          user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
          catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
          order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
          payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
          delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3005'
        }
      });
    });

    // Proxy routes to microservices
    this.setupProxyRoutes();
  }

  setupProxyRoutes() {
    const services = [
      {
        path: '/api/users',
        target: process.env.USER_SERVICE_URL || 'http://localhost:3001',
        public: ['/api/users/register', '/api/users/login']
      },
      {
        path: '/api/catalog',
        target: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
        public: ['/api/catalog/restaurants', '/api/catalog/menu']
      },
      {
        path: '/api/orders',
        target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
        public: []
      },
      {
        path: '/api/payments',
        target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
        public: []
      },
      {
        path: '/api/delivery',
        target: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3005',
        public: []
      }
    ];

    services.forEach(service => {
      // Setup authentication middleware
      this.app.use(service.path, (req, res, next) => {
        const fullPath = req.originalUrl;
        const isPublic = service.public.some(publicPath => 
          fullPath.startsWith(publicPath)
        );

        if (isPublic) {
          next();
        } else {
          this.authenticateToken(req, res, next);
        }
      });

      // Setup proxy with circuit breaker
      this.app.use(service.path, createProxyMiddleware({
        target: service.target,
        changeOrigin: true,
        onError: (err, req, res) => {
          logger.error(`Proxy error for ${service.path}:`, err);
          res.status(503).json({ 
            error: 'Service temporarily unavailable',
            service: service.path 
          });
        },
        onProxyReq: (proxyReq, req, res) => {
          // Add correlation ID for distributed tracing
          const correlationId = req.headers['x-correlation-id'] || 
            Math.random().toString(36).substring(7);
          proxyReq.setHeader('x-correlation-id', correlationId);
          
          // Forward user information
          if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
            proxyReq.setHeader('x-user-role', req.user.role || 'customer');
          }
        },
        // Add circuit breaker to proxy requests
        router: async (req) => {
          try {
            const serviceName = service.path.replace('/api/', '');
            await circuitBreakerManager.execute(serviceName, async () => {
              // This is a dummy check - in reality, you'd check service health
              return Promise.resolve();
            }, {
              failureThreshold: 3,
              resetTimeout: 30000, // 30 seconds
              expectedError: (error) => error.status >= 400 && error.status < 500
            });
            return service.target;
          } catch (error) {
            if (error.code === 'CIRCUIT_BREAKER_OPEN') {
              logger.warn(`Circuit breaker open for ${service.path}`);
              return null; // This will cause the proxy to fail
            }
            return service.target;
          }
        }
      }));
    });
  }

  async setupGraphQL() {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => ({
        user: req.user,
        services: {
          user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
          catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
          order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
          payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
          delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3005'
        }
      })
    });

    await server.start();
    server.applyMiddleware({ app: this.app, path: '/graphql' });
    
    logger.info('GraphQL server setup complete');
  }

  async start() {
    await this.setupRedis();
    
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
      logger.info(`API Gateway running on port ${PORT}`);
      logger.info(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  }
}

// Start the gateway
const gateway = new APIGateway();
gateway.start().catch(error => {
  logger.error('Failed to start API Gateway:', error);
  process.exit(1);
});

module.exports = APIGateway;