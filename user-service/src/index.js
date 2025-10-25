const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const { connectRabbitMQ, publishEvent } = require('./utils/messageQueue');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'user-service.log' })
  ]
});

class UserService {
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
        service: 'user-service',
        timestamp: new Date().toISOString() 
      });
    });

    // API routes
    this.app.use('/api/users', authRoutes);
    this.app.use('/api/users', userRoutes);
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
      
      if (error.code === 11000) {
        return res.status(409).json({ 
          error: 'Resource already exists',
          field: Object.keys(error.keyValue)[0]
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
      await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/user_service');
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async start() {
    try {
      await this.connectDatabase();
      await connectRabbitMQ();
      
      const PORT = process.env.PORT || 3001;
      this.app.listen(PORT, () => {
        logger.info(`User Service running on port ${PORT}`);
      });
    } catch (error) {
      logger.error('Failed to start User Service:', error);
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the service
const service = new UserService();
service.start();

module.exports = UserService;