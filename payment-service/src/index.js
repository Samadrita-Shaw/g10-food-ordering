const express = require('express');
const { Sequelize } = require('sequelize');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

const paymentRoutes = require('./routes/paymentRoutes');
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
    new winston.transports.File({ filename: 'payment-service.log' })
  ]
});

class PaymentService {
  constructor() {
    this.app = express();
    this.grpcServer = new grpc.Server();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupGrpcServer();
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
        service: 'payment-service',
        timestamp: new Date().toISOString() 
      });
    });

    // API routes
    this.app.use('/api/payments', paymentRoutes);
  }

  setupGrpcServer() {
    // Load proto definition
    const PROTO_PATH = path.join(__dirname, '../proto/payment.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });

    const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

    // Import gRPC service implementation
    const PaymentGrpcService = require('./grpc/paymentGrpcService');
    const grpcService = new PaymentGrpcService();

    // Add service to gRPC server
    this.grpcServer.addService(paymentProto.PaymentService.service, {
      ProcessPayment: grpcService.processPayment.bind(grpcService),
      RefundPayment: grpcService.refundPayment.bind(grpcService),
      GetPaymentStatus: grpcService.getPaymentStatus.bind(grpcService)
    });
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
      
      // Start REST API server
      const PORT = process.env.PORT || 3004;
      this.app.listen(PORT, () => {
        logger.info(`Payment Service REST API running on port ${PORT}`);
      });

      // Start gRPC server
      const GRPC_PORT = process.env.GRPC_PORT || 50051;
      const grpcAddress = `0.0.0.0:${GRPC_PORT}`;
      
      this.grpcServer.bindAsync(
        grpcAddress,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            logger.error('Failed to start gRPC server:', error);
            return;
          }
          this.grpcServer.start();
          logger.info(`Payment Service gRPC server running on port ${port}`);
        }
      );

    } catch (error) {
      logger.error('Failed to start Payment Service:', error);
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
const service = new PaymentService();
service.start();

module.exports = PaymentService;