const winston = require('winston');
const { Order, SagaTransaction } = require('../models');
const { publishEvent } = require('../utils/messageQueue');
const { processPayment } = require('../utils/grpcClient');

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
 * Order Saga Orchestrator
 * Implements choreography-based saga pattern for distributed transactions
 */
class OrderSaga {
  constructor() {
    this.steps = [
      'validate_order',
      'process_payment',
      'notify_restaurant',
      'assign_delivery',
      'complete_order'
    ];
  }

  /**
   * Start the order processing saga
   */
  async startSaga(orderId) {
    try {
      const order = await Order.findByPk(orderId, {
        include: ['items']
      });

      if (!order) {
        throw new Error('Order not found');
      }

      logger.info(`Starting saga for order ${orderId}`);
      
      // Update saga status
      await order.update({ sagaStatus: 'started' });

      // Start with order validation
      await this.executeStep(orderId, 'validate_order');
      
    } catch (error) {
      logger.error(`Failed to start saga for order ${orderId}:`, error);
      await this.handleSagaFailure(orderId, 'start', error);
    }
  }

  /**
   * Execute a specific saga step
   */
  async executeStep(orderId, step, data = {}) {
    try {
      // Create saga transaction log
      const transaction = await SagaTransaction.create({
        orderId,
        step,
        status: 'pending',
        requestData: data
      });

      logger.info(`Executing saga step: ${step} for order ${orderId}`);

      let result;
      switch (step) {
        case 'validate_order':
          result = await this.validateOrder(orderId);
          break;
        case 'process_payment':
          result = await this.processPayment(orderId);
          break;
        case 'notify_restaurant':
          result = await this.notifyRestaurant(orderId);
          break;
        case 'assign_delivery':
          result = await this.assignDelivery(orderId);
          break;
        case 'complete_order':
          result = await this.completeOrder(orderId);
          break;
        default:
          throw new Error(`Unknown saga step: ${step}`);
      }

      // Update transaction log
      await transaction.update({
        status: 'completed',
        responseData: result
      });

      // Move to next step
      await this.moveToNextStep(orderId, step);

    } catch (error) {
      logger.error(`Saga step ${step} failed for order ${orderId}:`, error);
      
      // Update transaction log
      await SagaTransaction.update(
        { 
          status: 'failed', 
          error: error.message 
        },
        { where: { orderId, step } }
      );

      // Start compensation
      await this.startCompensation(orderId, step);
    }
  }

  /**
   * Validate order details
   */
  async validateOrder(orderId) {
    const order = await Order.findByPk(orderId, {
      include: ['items']
    });

    // Validate order items exist and are available
    // In a real implementation, this would call the catalog service
    if (!order.items || order.items.length === 0) {
      throw new Error('Order has no items');
    }

    // Validate delivery address
    if (!order.deliveryAddress) {
      throw new Error('Delivery address is required');
    }

    // Update order status
    await order.update({ status: 'confirmed' });

    // Publish event
    await publishEvent('order.validated', {
      orderId: order.id,
      userId: order.userId,
      restaurantId: order.restaurantId
    });

    return { validated: true };
  }

  /**
   * Process payment via gRPC
   */
  async processPayment(orderId) {
    const order = await Order.findByPk(orderId);
    
    await order.update({ sagaStatus: 'payment_processing' });

    try {
      const paymentResult = await processPayment({
        orderId: order.id,
        amount: parseFloat(order.totalAmount),
        userId: order.userId
      });

      await order.update({ sagaStatus: 'payment_confirmed' });

      // Publish event
      await publishEvent('order.payment_processed', {
        orderId: order.id,
        paymentId: paymentResult.paymentId,
        amount: order.totalAmount
      });

      return paymentResult;
    } catch (error) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  /**
   * Notify restaurant about new order
   */
  async notifyRestaurant(orderId) {
    const order = await Order.findByPk(orderId, {
      include: ['items']
    });

    await order.update({ sagaStatus: 'restaurant_notified' });

    // Publish event for restaurant service
    await publishEvent('order.restaurant_notification', {
      orderId: order.id,
      restaurantId: order.restaurantId,
      items: order.items,
      totalAmount: order.totalAmount,
      estimatedPrepTime: 30 // minutes
    });

    // Update estimated delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);
    
    await order.update({ 
      estimatedDeliveryTime,
      status: 'preparing'
    });

    return { notified: true, estimatedDeliveryTime };
  }

  /**
   * Assign delivery driver
   */
  async assignDelivery(orderId) {
    const order = await Order.findByPk(orderId);

    await order.update({ sagaStatus: 'delivery_assigned' });

    // Publish event for delivery service
    await publishEvent('order.delivery_assignment', {
      orderId: order.id,
      restaurantId: order.restaurantId,
      deliveryAddress: order.deliveryAddress,
      estimatedDeliveryTime: order.estimatedDeliveryTime
    });

    await order.update({ status: 'ready_for_pickup' });

    return { assigned: true };
  }

  /**
   * Complete the order
   */
  async completeOrder(orderId) {
    const order = await Order.findByPk(orderId);

    await order.update({ 
      sagaStatus: 'completed',
      status: 'confirmed'
    });

    // Publish completion event
    await publishEvent('order.saga_completed', {
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount
    });

    logger.info(`Order saga completed successfully for order ${orderId}`);
    return { completed: true };
  }

  /**
   * Move to the next step in the saga
   */
  async moveToNextStep(orderId, currentStep) {
    const currentIndex = this.steps.indexOf(currentStep);
    if (currentIndex < this.steps.length - 1) {
      const nextStep = this.steps[currentIndex + 1];
      // Add small delay to prevent overwhelming services
      setTimeout(() => {
        this.executeStep(orderId, nextStep);
      }, 1000);
    }
  }

  /**
   * Start compensation (rollback) process
   */
  async startCompensation(orderId, failedStep) {
    logger.info(`Starting compensation for order ${orderId} at step ${failedStep}`);
    
    const order = await Order.findByPk(orderId);
    await order.update({ sagaStatus: 'compensating' });

    // Get all completed transactions for this order
    const completedTransactions = await SagaTransaction.findAll({
      where: { 
        orderId, 
        status: 'completed' 
      },
      order: [['createdAt', 'DESC']]
    });

    // Execute compensation in reverse order
    for (const transaction of completedTransactions) {
      await this.compensateStep(orderId, transaction.step);
    }

    await order.update({ 
      sagaStatus: 'compensated',
      status: 'failed'
    });

    // Publish compensation completed event
    await publishEvent('order.compensation_completed', {
      orderId,
      failedStep,
      reason: 'Saga compensation completed'
    });
  }

  /**
   * Compensate a specific step
   */
  async compensateStep(orderId, step) {
    try {
      logger.info(`Compensating step: ${step} for order ${orderId}`);

      switch (step) {
        case 'validate_order':
          // No compensation needed for validation
          break;
        case 'process_payment':
          await this.refundPayment(orderId);
          break;
        case 'notify_restaurant':
          await this.cancelRestaurantOrder(orderId);
          break;
        case 'assign_delivery':
          await this.cancelDelivery(orderId);
          break;
      }

      // Mark transaction as compensated
      await SagaTransaction.update(
        { status: 'compensated' },
        { where: { orderId, step } }
      );

    } catch (error) {
      logger.error(`Compensation failed for step ${step}:`, error);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(orderId) {
    // Publish refund event
    await publishEvent('payment.refund_requested', {
      orderId,
      reason: 'Order saga compensation'
    });
  }

  /**
   * Cancel restaurant order
   */
  async cancelRestaurantOrder(orderId) {
    // Publish cancellation event
    await publishEvent('restaurant.order_cancelled', {
      orderId,
      reason: 'Order saga compensation'
    });
  }

  /**
   * Cancel delivery assignment
   */
  async cancelDelivery(orderId) {
    // Publish delivery cancellation event
    await publishEvent('delivery.assignment_cancelled', {
      orderId,
      reason: 'Order saga compensation'
    });
  }

  /**
   * Handle saga failure
   */
  async handleSagaFailure(orderId, step, error) {
    const order = await Order.findByPk(orderId);
    await order.update({ 
      sagaStatus: 'failed',
      status: 'failed'
    });

    await publishEvent('order.saga_failed', {
      orderId,
      failedStep: step,
      error: error.message
    });

    logger.error(`Order saga failed for order ${orderId} at step ${step}:`, error);
  }
}

module.exports = OrderSaga;