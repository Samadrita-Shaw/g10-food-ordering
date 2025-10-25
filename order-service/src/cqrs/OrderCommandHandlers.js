const { Order, OrderItem } = require('../models');
const { publishEvent } = require('../utils/messageQueue');
const OrderSaga = require('../saga/OrderSaga');
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
 * CQRS Command Handlers for Order Service
 * Handles all write operations (Commands) that modify order state
 */
class OrderCommandHandlers {
  constructor() {
    this.saga = new OrderSaga();
  }

  /**
   * Create new order command
   */
  async createOrder(orderData) {
    const transaction = await Order.sequelize.transaction();

    try {
      // Calculate total amount
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      // Create order
      const order = await Order.create({
        userId: orderData.userId,
        restaurantId: orderData.restaurantId,
        totalAmount,
        deliveryAddress: orderData.deliveryAddress,
        status: 'pending',
        sagaStatus: 'started'
      }, { transaction });

      // Create order items
      const orderItems = await Promise.all(
        orderData.items.map(item =>
          OrderItem.create({
            orderId: order.id,
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions
          }, { transaction })
        )
      );

      await transaction.commit();

      // Publish command event
      await publishEvent('order.create_command', {
        orderId: order.id,
        userId: order.userId,
        restaurantId: order.restaurantId,
        totalAmount: order.totalAmount,
        items: orderItems.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });

      // Start saga asynchronously
      setImmediate(() => {
        this.saga.startSaga(order.id).catch(error => {
          logger.error(`Failed to start saga for order ${order.id}:`, error);
        });
      });

      // Return order with items
      const createdOrder = await Order.findByPk(order.id, {
        include: ['items']
      });

      logger.info(`Order created successfully: ${order.id}`);
      
      return {
        message: 'Order created successfully',
        order: createdOrder
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Update order status command
   */
  async updateOrderStatus(orderId, statusData, user) {
    try {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate user permissions
      const canUpdate = this._canUpdateOrder(order, user);
      if (!canUpdate) {
        throw new Error('Access denied');
      }

      // Validate status transition
      const validTransition = this._isValidStatusTransition(order.status, statusData.status);
      if (!validTransition) {
        throw new Error(`Invalid status transition from ${order.status} to ${statusData.status}`);
      }

      // Update order
      const updatedOrder = await order.update({
        status: statusData.status,
        estimatedDeliveryTime: statusData.estimatedReadyTime || order.estimatedDeliveryTime,
        metadata: {
          ...order.metadata,
          lastUpdatedBy: user.id,
          statusNotes: statusData.notes
        }
      });

      // Publish command event
      await publishEvent('order.status_update_command', {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: statusData.status,
        updatedBy: user.id,
        userRole: user.role,
        timestamp: new Date()
      });

      logger.info(`Order status updated: ${orderId} from ${order.status} to ${statusData.status}`);

      return {
        message: 'Order status updated successfully',
        order: updatedOrder
      };

    } catch (error) {
      logger.error(`Failed to update order status for ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel order command
   */
  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if user can cancel this order
      if (order.userId !== userId) {
        throw new Error('Access denied');
      }

      // Check if order can be cancelled
      const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      // Update order status
      const cancelledOrder = await order.update({
        status: 'cancelled',
        cancelReason: reason,
        sagaStatus: 'compensating'
      });

      // Publish cancellation command event
      await publishEvent('order.cancel_command', {
        orderId: order.id,
        userId: order.userId,
        restaurantId: order.restaurantId,
        reason,
        originalStatus: order.status,
        totalAmount: order.totalAmount
      });

      // Start compensation saga
      setImmediate(() => {
        this.saga.startCompensation(order.id, 'user_cancellation').catch(error => {
          logger.error(`Failed to start compensation for order ${order.id}:`, error);
        });
      });

      logger.info(`Order cancelled: ${orderId} by user ${userId}`);

      return {
        message: 'Order cancelled successfully',
        order: cancelledOrder
      };

    } catch (error) {
      logger.error(`Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Process refund command
   */
  async processRefund(orderId, refundData, userId) {
    try {
      const order = await Order.findByPk(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate refund eligibility
      if (order.status !== 'cancelled' && order.status !== 'failed') {
        throw new Error('Order is not eligible for refund');
      }

      // Update order with refund information
      const updatedOrder = await order.update({
        metadata: {
          ...order.metadata,
          refundProcessed: true,
          refundAmount: refundData.amount,
          refundReason: refundData.reason,
          refundProcessedBy: userId,
          refundProcessedAt: new Date()
        }
      });

      // Publish refund command event
      await publishEvent('order.refund_command', {
        orderId: order.id,
        refundAmount: refundData.amount,
        reason: refundData.reason,
        processedBy: userId
      });

      logger.info(`Refund processed for order: ${orderId}`);

      return {
        message: 'Refund processed successfully',
        order: updatedOrder
      };

    } catch (error) {
      logger.error(`Failed to process refund for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to check if user can update order
   */
  _canUpdateOrder(order, user) {
    switch (user.role) {
      case 'admin':
        return true;
      case 'restaurant_owner':
        // Restaurant owner can update orders for their restaurant
        return true; // In real implementation, check if user owns the restaurant
      case 'delivery_driver':
        // Driver can update delivery status
        return ['ready_for_pickup', 'out_for_delivery'].includes(order.status);
      default:
        return false;
    }
  }

  /**
   * Helper method to validate status transitions
   */
  _isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready_for_pickup', 'cancelled'],
      'ready_for_pickup': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'failed'],
      'delivered': [], // Terminal state
      'cancelled': [], // Terminal state
      'failed': ['cancelled'] // Can only move to cancelled for cleanup
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

module.exports = OrderCommandHandlers;