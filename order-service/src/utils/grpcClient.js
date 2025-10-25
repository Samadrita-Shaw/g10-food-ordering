const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
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

// Load the payment service proto
const PROTO_PATH = path.join(__dirname, '../../payment-service/proto/payment.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const paymentProto = grpc.loadPackageDefinition(packageDefinition).payment;

class PaymentGrpcClient {
  constructor() {
    const grpcUrl = process.env.PAYMENT_SERVICE_GRPC_URL || 'localhost:50051';
    this.client = new paymentProto.PaymentService(grpcUrl, grpc.credentials.createInsecure());
  }

  /**
   * Process payment via gRPC
   */
  async processPayment(paymentRequest) {
    return new Promise((resolve, reject) => {
      this.client.ProcessPayment(paymentRequest, (error, response) => {
        if (error) {
          logger.error('gRPC payment processing failed:', error);
          reject(error);
        } else {
          logger.info(`Payment processed successfully: ${response.payment_id}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * Refund payment via gRPC
   */
  async refundPayment(refundRequest) {
    return new Promise((resolve, reject) => {
      this.client.RefundPayment(refundRequest, (error, response) => {
        if (error) {
          logger.error('gRPC refund processing failed:', error);
          reject(error);
        } else {
          logger.info(`Refund processed successfully: ${response.refund_id}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * Get payment status via gRPC
   */
  async getPaymentStatus(statusRequest) {
    return new Promise((resolve, reject) => {
      this.client.GetPaymentStatus(statusRequest, (error, response) => {
        if (error) {
          logger.error('gRPC payment status check failed:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Create singleton instance
const paymentClient = new PaymentGrpcClient();

// Wrapper function for easier use in saga
const processPayment = async (paymentData) => {
  try {
    const response = await paymentClient.processPayment({
      order_id: paymentData.orderId,
      user_id: paymentData.userId,
      amount: paymentData.amount,
      currency: 'USD',
      payment_method: 'credit_card',
      payment_details: {
        // In real implementation, get these from secure vault
        card_number: '4111111111111111',
        card_holder_name: 'Test User',
        expiry_month: '12',
        expiry_year: '2025',
        cvv: '123'
      }
    });

    return {
      paymentId: response.payment_id,
      transactionId: response.transaction_id,
      status: response.status,
      amount: response.amount
    };
  } catch (error) {
    throw new Error(`Payment processing failed: ${error.message}`);
  }
};

const refundPayment = async (refundData) => {
  try {
    const response = await paymentClient.refundPayment({
      payment_id: refundData.paymentId,
      order_id: refundData.orderId,
      amount: refundData.amount,
      reason: refundData.reason
    });

    return {
      refundId: response.refund_id,
      status: response.status,
      refundedAmount: response.refunded_amount
    };
  } catch (error) {
    throw new Error(`Refund processing failed: ${error.message}`);
  }
};

module.exports = {
  PaymentGrpcClient,
  paymentClient,
  processPayment,
  refundPayment
};