const express = require('express');
const Joi = require('joi');
const { Order, OrderItem } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { publishEvent } = require('../utils/messageQueue');
const OrderSaga = require('../saga/OrderSaga');

const router = express.Router();

// CQRS - Command handlers for write operations
const OrderCommandHandlers = require('../cqrs/OrderCommandHandlers');
const OrderQueryHandlers = require('../cqrs/OrderQueryHandlers');

// Validation schemas
const createOrderSchema = Joi.object({
  restaurantId: Joi.string().required(),
  items: Joi.array().items(Joi.object({
    menuItemId: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().min(1).required(),
    specialInstructions: Joi.string().optional()
  })).min(1).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required()
    }).optional()
  }).required()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled').required(),
  estimatedReadyTime: Joi.date().optional(),
  notes: Joi.string().optional()
});

// CQRS Commands (Write Operations)

// Create order - Command
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Use CQRS Command Handler
    const commandHandler = new OrderCommandHandlers();
    const result = await commandHandler.createOrder({
      ...value,
      userId: req.user.id
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Update order status - Command
router.put('/:orderId/status', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = updateOrderStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const commandHandler = new OrderCommandHandlers();
    const result = await commandHandler.updateOrderStatus(
      req.params.orderId,
      value,
      req.user
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Cancel order - Command
router.put('/:orderId/cancel', authenticateToken, async (req, res, next) => {
  try {
    const { reason } = req.body;

    const commandHandler = new OrderCommandHandlers();
    const result = await commandHandler.cancelOrder(
      req.params.orderId,
      req.user.id,
      reason
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// CQRS Queries (Read Operations)

// Get user orders - Query
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const queryHandler = new OrderQueryHandlers();
    const result = await queryHandler.getUserOrders(req.user.id, {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      order
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get order by ID - Query
router.get('/:orderId', authenticateToken, async (req, res, next) => {
  try {
    const queryHandler = new OrderQueryHandlers();
    const result = await queryHandler.getOrderById(req.params.orderId, req.user.id);

    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get restaurant orders - Query (for restaurant owners)
router.get('/restaurant/:restaurantId', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const queryHandler = new OrderQueryHandlers();
    const result = await queryHandler.getRestaurantOrders(req.params.restaurantId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get order analytics - Query (for restaurant owners and admins)
router.get('/analytics/summary', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { restaurantId, startDate, endDate } = req.query;

    const queryHandler = new OrderQueryHandlers();
    const result = await queryHandler.getOrderAnalytics({
      restaurantId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: req.user.role === 'restaurant_owner' ? req.user.id : undefined
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Real-time order tracking - Query
router.get('/:orderId/tracking', authenticateToken, async (req, res, next) => {
  try {
    const queryHandler = new OrderQueryHandlers();
    const result = await queryHandler.getOrderTracking(req.params.orderId, req.user.id);

    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;