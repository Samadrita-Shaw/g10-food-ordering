const { Payment, Refund } = require('../models');
const { publishEvent } = require('../utils/messageQueue');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

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
 * gRPC Service Implementation for Payment Service
 */
class PaymentGrpcService {
  
  /**
   * Process payment gRPC method
   */
  async processPayment(call, callback) {
    try {
      const request = call.request;
      logger.info('Processing payment via gRPC:', {
        orderId: request.order_id,
        amount: request.amount
      });

      // Validate request
      if (!request.order_id || !request.user_id || !request.amount) {
        const error = new Error('Missing required fields');
        error.code = grpc.status.INVALID_ARGUMENT;
        return callback(error);
      }

      // Create payment record
      const payment = await Payment.create({
        orderId: request.order_id,
        userId: request.user_id,
        amount: request.amount,
        currency: request.currency || 'USD',
        method: request.payment_method || 'credit_card',
        status: 'processing'
      });

      // Simulate payment processing with external gateway
      const transactionResult = await this.processWithGateway(request);
      
      if (transactionResult.success) {
        // Update payment as completed
        await payment.update({
          status: 'completed',
          transactionId: transactionResult.transactionId,
          gatewayResponse: transactionResult.response
        });

        // Publish payment success event
        await publishEvent('payment.processed', {
          paymentId: payment.id,
          orderId: request.order_id,
          amount: request.amount,
          transactionId: transactionResult.transactionId,
          status: 'completed'
        });

        const response = {
          payment_id: payment.id,
          transaction_id: transactionResult.transactionId,
          status: 'COMPLETED',
          message: 'Payment processed successfully',
          amount: request.amount,
          currency: request.currency || 'USD',
          timestamp: Date.now()
        };

        logger.info('Payment processed successfully:', { paymentId: payment.id });
        callback(null, response);

      } else {
        // Update payment as failed
        await payment.update({
          status: 'failed',
          failureReason: transactionResult.error,
          gatewayResponse: transactionResult.response
        });

        // Publish payment failure event
        await publishEvent('payment.failed', {
          paymentId: payment.id,
          orderId: request.order_id,
          amount: request.amount,
          reason: transactionResult.error,
          status: 'failed'
        });

        const error = new Error(`Payment failed: ${transactionResult.error}`);
        error.code = grpc.status.ABORTED;
        callback(error);
      }

    } catch (error) {
      logger.error('Payment processing error:', error);
      const grpcError = new Error('Internal payment processing error');
      grpcError.code = grpc.status.INTERNAL;
      callback(grpcError);
    }
  }

  /**
   * Refund payment gRPC method
   */
  async refundPayment(call, callback) {
    try {
      const request = call.request;
      logger.info('Processing refund via gRPC:', {
        paymentId: request.payment_id,
        amount: request.amount
      });

      // Find original payment
      const payment = await Payment.findByPk(request.payment_id);
      if (!payment) {
        const error = new Error('Payment not found');
        error.code = grpc.status.NOT_FOUND;
        return callback(error);
      }

      // Validate refund amount
      const totalRefunded = await Refund.sum('amount', {
        where: { paymentId: payment.id, status: 'completed' }
      }) || 0;
      
      if (parseFloat(totalRefunded) + parseFloat(request.amount) > parseFloat(payment.amount)) {
        const error = new Error('Refund amount exceeds available balance');
        error.code = grpc.status.INVALID_ARGUMENT;
        return callback(error);
      }

      // Create refund record
      const refund = await Refund.create({
        paymentId: payment.id,
        orderId: request.order_id,
        amount: request.amount,
        reason: request.reason,
        status: 'pending'
      });

      // Process refund with gateway
      const refundResult = await this.processRefundWithGateway(payment.transactionId, request.amount);

      if (refundResult.success) {
        // Update refund as completed
        await refund.update({
          status: 'completed',
          refundTransactionId: refundResult.refundTransactionId,
          gatewayResponse: refundResult.response
        });

        // Update payment refunded amount
        const newRefundedAmount = parseFloat(payment.refundedAmount) + parseFloat(request.amount);
        const newStatus = newRefundedAmount >= parseFloat(payment.amount) ? 'refunded' : 'partially_refunded';
        
        await payment.update({
          refundedAmount: newRefundedAmount,
          status: newStatus
        });

        // Publish refund success event
        await publishEvent('payment.refunded', {
          paymentId: payment.id,
          refundId: refund.id,
          orderId: request.order_id,
          refundAmount: request.amount,
          totalRefunded: newRefundedAmount,
          refundTransactionId: refundResult.refundTransactionId
        });

        const response = {
          refund_id: refund.id,
          status: 'COMPLETED',
          message: 'Refund processed successfully',
          refunded_amount: request.amount,
          timestamp: Date.now()
        };

        logger.info('Refund processed successfully:', { refundId: refund.id });
        callback(null, response);

      } else {
        // Update refund as failed
        await refund.update({
          status: 'failed',
          gatewayResponse: refundResult.response
        });

        const error = new Error(`Refund failed: ${refundResult.error}`);
        error.code = grpc.status.ABORTED;
        callback(error);
      }

    } catch (error) {
      logger.error('Refund processing error:', error);
      const grpcError = new Error('Internal refund processing error');
      grpcError.code = grpc.status.INTERNAL;
      callback(grpcError);
    }
  }

  /**
   * Get payment status gRPC method
   */
  async getPaymentStatus(call, callback) {
    try {
      const request = call.request;
      
      const whereClause = {};
      if (request.payment_id) whereClause.id = request.payment_id;
      if (request.order_id) whereClause.orderId = request.order_id;

      const payment = await Payment.findOne({
        where: whereClause,
        include: [{ model: Refund, as: 'refunds' }]
      });

      if (!payment) {
        const error = new Error('Payment not found');
        error.code = grpc.status.NOT_FOUND;
        return callback(error);
      }

      const response = {
        payment_id: payment.id,
        order_id: payment.orderId,
        status: this.mapStatusToGrpc(payment.status),
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        created_at: payment.createdAt.getTime(),
        updated_at: payment.updatedAt.getTime()
      };

      callback(null, response);

    } catch (error) {
      logger.error('Get payment status error:', error);
      const grpcError = new Error('Internal error retrieving payment status');
      grpcError.code = grpc.status.INTERNAL;
      callback(grpcError);
    }
  }

  /**
   * Simulate payment processing with external gateway
   */
  async processWithGateway(paymentRequest) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        transactionId: `txn_${uuidv4()}`,
        response: {
          gateway: 'stripe_simulator',
          status: 'succeeded',
          processed_at: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: 'Card declined',
        response: {
          gateway: 'stripe_simulator',
          status: 'failed',
          error_code: 'card_declined',
          processed_at: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Simulate refund processing with external gateway
   */
  async processRefundWithGateway(transactionId, amount) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate success (95% success rate for refunds)
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        refundTransactionId: `rfnd_${uuidv4()}`,
        response: {
          gateway: 'stripe_simulator',
          status: 'succeeded',
          original_transaction: transactionId,
          processed_at: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: 'Refund processing failed',
        response: {
          gateway: 'stripe_simulator',
          status: 'failed',
          error_code: 'refund_failed',
          processed_at: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Map database status to gRPC enum
   */
  mapStatusToGrpc(status) {
    const statusMap = {
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'completed': 'COMPLETED',
      'failed': 'FAILED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'partially_refunded': 'PARTIALLY_REFUNDED'
    };
    return statusMap[status] || 'PENDING';
  }
}

module.exports = PaymentGrpcService;