const { Order, OrderItem } = require('../models');
const { Sequelize } = require('sequelize');
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
 * CQRS Query Handlers for Order Service
 * Handles all read operations (Queries) that retrieve order data
 * Optimized for different read patterns and use cases
 */
class OrderQueryHandlers {
  
  /**
   * Get user orders with filtering and pagination
   */
  async getUserOrders(userId, filters = {}) {
    try {
      const {
        status,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        order = 'desc'
      } = filters;

      // Build query conditions
      const where = { userId };
      if (status) {
        where.status = status;
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Execute query with optimized includes
      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [{
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'menuItemId', 'name', 'price', 'quantity', 'specialInstructions']
        }],
        order: [[sortBy, order.toUpperCase()]],
        limit,
        offset,
        attributes: [
          'id', 'restaurantId', 'status', 'totalAmount', 'deliveryAddress',
          'estimatedDeliveryTime', 'actualDeliveryTime', 'createdAt', 'sagaStatus'
        ]
      });

      logger.info(`Retrieved ${orders.length} orders for user ${userId}`);

      return {
        orders,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error(`Failed to get user orders for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get order by ID with full details
   */
  async getOrderById(orderId, userId) {
    try {
      const order = await Order.findOne({
        where: { 
          id: orderId,
          userId // Ensure user can only access their own orders
        },
        include: [{
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'menuItemId', 'name', 'price', 'quantity', 'specialInstructions']
        }],
        attributes: {
          exclude: ['updatedAt'] // Exclude fields not needed in response
        }
      });

      if (order) {
        logger.info(`Retrieved order details: ${orderId}`);
      }

      return order;

    } catch (error) {
      logger.error(`Failed to get order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get restaurant orders (for restaurant owners)
   */
  async getRestaurantOrders(restaurantId, filters = {}) {
    try {
      const {
        status,
        page = 1,
        limit = 20,
        startDate,
        endDate
      } = filters;

      // Build query conditions
      const where = { restaurantId };
      if (status) {
        where.status = status;
      }

      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Sequelize.Op.gte] = startDate;
        if (endDate) where.createdAt[Sequelize.Op.lte] = endDate;
      }

      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [{
          model: OrderItem,
          as: 'items',
          attributes: ['menuItemId', 'name', 'quantity', 'price']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        attributes: [
          'id', 'userId', 'status', 'totalAmount', 'deliveryAddress',
          'estimatedDeliveryTime', 'createdAt'
        ]
      });

      logger.info(`Retrieved ${orders.length} orders for restaurant ${restaurantId}`);

      return {
        orders,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error(`Failed to get restaurant orders for ${restaurantId}:`, error);
      throw error;
    }
  }

  /**
   * Get order analytics and metrics
   */
  async getOrderAnalytics(filters = {}) {
    try {
      const {
        restaurantId,
        startDate,
        endDate,
        userId // For restaurant owner filtering
      } = filters;

      // Build base query
      const baseWhere = {};
      if (restaurantId) baseWhere.restaurantId = restaurantId;
      if (startDate || endDate) {
        baseWhere.createdAt = {};
        if (startDate) baseWhere.createdAt[Sequelize.Op.gte] = startDate;
        if (endDate) baseWhere.createdAt[Sequelize.Op.lte] = endDate;
      }

      // Get order statistics
      const [
        totalOrders,
        totalRevenue,
        averageOrderValue,
        statusDistribution,
        dailyOrders
      ] = await Promise.all([
        // Total orders count
        Order.count({ where: baseWhere }),

        // Total revenue
        Order.sum('totalAmount', { 
          where: { 
            ...baseWhere, 
            status: ['delivered', 'completed'] 
          } 
        }),

        // Average order value
        Order.findOne({
          where: { 
            ...baseWhere, 
            status: ['delivered', 'completed'] 
          },
          attributes: [
            [Sequelize.fn('AVG', Sequelize.col('totalAmount')), 'averageValue']
          ]
        }),

        // Status distribution
        Order.findAll({
          where: baseWhere,
          attributes: [
            'status',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
          ],
          group: ['status']
        }),

        // Daily orders (last 30 days)
        Order.findAll({
          where: {
            ...baseWhere,
            createdAt: {
              [Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
            [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalRevenue']
          ],
          group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
          order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']]
        })
      ]);

      const analytics = {
        summary: {
          totalOrders,
          totalRevenue: totalRevenue || 0,
          averageOrderValue: averageOrderValue?.dataValues?.averageValue || 0,
          completionRate: totalOrders > 0 ? 
            ((statusDistribution.find(s => s.status === 'delivered')?.dataValues?.count || 0) / totalOrders * 100).toFixed(2) 
            : 0
        },
        statusDistribution: statusDistribution.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count),
          percentage: totalOrders > 0 ? 
            (parseInt(item.dataValues.count) / totalOrders * 100).toFixed(2) 
            : 0
        })),
        dailyTrends: dailyOrders.map(item => ({
          date: item.dataValues.date,
          orderCount: parseInt(item.dataValues.orderCount),
          revenue: parseFloat(item.dataValues.totalRevenue || 0)
        }))
      };

      logger.info('Generated order analytics');
      return analytics;

    } catch (error) {
      logger.error('Failed to generate order analytics:', error);
      throw error;
    }
  }

  /**
   * Get order tracking information
   */
  async getOrderTracking(orderId, userId) {
    try {
      const order = await Order.findOne({
        where: { 
          id: orderId,
          userId 
        },
        attributes: [
          'id', 'status', 'sagaStatus', 'restaurantId', 'totalAmount',
          'estimatedDeliveryTime', 'actualDeliveryTime', 'createdAt'
        ]
      });

      if (!order) {
        return null;
      }

      // Create tracking timeline
      const timeline = this._generateTrackingTimeline(order);

      logger.info(`Retrieved tracking info for order: ${orderId}`);

      return {
        order: {
          id: order.id,
          status: order.status,
          sagaStatus: order.sagaStatus,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          actualDeliveryTime: order.actualDeliveryTime
        },
        timeline,
        currentStep: this._getCurrentTrackingStep(order.status),
        estimatedTimeRemaining: this._calculateEstimatedTimeRemaining(order)
      };

    } catch (error) {
      logger.error(`Failed to get tracking for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Search orders by various criteria
   */
  async searchOrders(searchCriteria, userContext) {
    try {
      const {
        query,
        status,
        restaurantId,
        userId,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        page = 1,
        limit = 20
      } = searchCriteria;

      // Build search conditions
      const where = {};
      
      // Add user context filtering
      if (userContext.role === 'customer') {
        where.userId = userContext.id;
      } else if (userContext.role === 'restaurant_owner' && restaurantId) {
        where.restaurantId = restaurantId;
      }

      // Add filters
      if (status) where.status = status;
      if (userId && userContext.role === 'admin') where.userId = userId;
      if (restaurantId && userContext.role !== 'customer') where.restaurantId = restaurantId;
      
      // Date range
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Sequelize.Op.gte] = new Date(dateFrom);
        if (dateTo) where.createdAt[Sequelize.Op.lte] = new Date(dateTo);
      }

      // Amount range
      if (minAmount || maxAmount) {
        where.totalAmount = {};
        if (minAmount) where.totalAmount[Sequelize.Op.gte] = minAmount;
        if (maxAmount) where.totalAmount[Sequelize.Op.lte] = maxAmount;
      }

      // Text search in order items
      let includeCondition = {};
      if (query) {
        includeCondition = {
          model: OrderItem,
          as: 'items',
          where: {
            name: { [Sequelize.Op.iLike]: `%${query}%` }
          },
          required: true
        };
      } else {
        includeCondition = {
          model: OrderItem,
          as: 'items'
        };
      }

      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [includeCondition],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      logger.info(`Search returned ${orders.length} orders`);

      return {
        orders,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('Failed to search orders:', error);
      throw error;
    }
  }

  /**
   * Helper method to generate tracking timeline
   */
  _generateTrackingTimeline(order) {
    const steps = [
      { status: 'pending', title: 'Order Placed', completed: true },
      { status: 'confirmed', title: 'Order Confirmed', completed: false },
      { status: 'preparing', title: 'Preparing', completed: false },
      { status: 'ready_for_pickup', title: 'Ready for Pickup', completed: false },
      { status: 'out_for_delivery', title: 'Out for Delivery', completed: false },
      { status: 'delivered', title: 'Delivered', completed: false }
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
      timestamp: index <= currentIndex ? order.createdAt : null
    }));
  }

  /**
   * Helper method to get current tracking step
   */
  _getCurrentTrackingStep(status) {
    const stepMap = {
      'pending': 1,
      'confirmed': 2,
      'preparing': 3,
      'ready_for_pickup': 4,
      'out_for_delivery': 5,
      'delivered': 6,
      'cancelled': -1,
      'failed': -1
    };
    return stepMap[status] || 0;
  }

  /**
   * Helper method to calculate estimated time remaining
   */
  _calculateEstimatedTimeRemaining(order) {
    if (!order.estimatedDeliveryTime) return null;
    
    const now = new Date();
    const estimated = new Date(order.estimatedDeliveryTime);
    const remaining = estimated.getTime() - now.getTime();
    
    return remaining > 0 ? Math.ceil(remaining / (1000 * 60)) : 0; // minutes
  }
}

module.exports = OrderQueryHandlers;