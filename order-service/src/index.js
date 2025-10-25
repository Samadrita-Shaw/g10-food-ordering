const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');
const { connectRabbitMQ, publishEvent } = require('./utils/messageQueue');
const { sequelize } = require('./models');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'order-service.log' })
  ]
});

class OrderService {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        correlationId: req.headers['x-correlation-id'],
        userId: req.headers['x-user-id']
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        service: 'order-service',
        timestamp: new Date().toISOString() 
      });
    });

    // API routes
    this.app.use('/api/orders', orderRoutes);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.message 
        });
      }
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Database validation failed',
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ 
        error: 'Internal server error',
        requestId: req.headers['x-correlation-id']
      });
    });
  }

  async connectDatabase() {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true }); // Auto-update database schema
      logger.info('Connected to PostgreSQL and synced models');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async start() {
    try {
      await this.connectDatabase();
      await connectRabbitMQ();
      
      const PORT = process.env.PORT || 3003;
      this.app.listen(PORT, () => {
        logger.info(`Order Service running on port ${PORT}`);
      });
    } catch (error) {
      logger.error('Failed to start Order Service:', error);
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Start the service
const service = new OrderService();
service.start();

module.exports = OrderService;