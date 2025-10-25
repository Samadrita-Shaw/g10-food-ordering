const express = require('express');
const Joi = require('joi');
const { Restaurant } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { publishEvent } = require('../utils/messageQueue');

const router = express.Router();

// Validation schemas
const createRestaurantSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().required(),
  cuisine: Joi.string().valid('italian', 'chinese', 'indian', 'mexican', 'american', 'thai', 'japanese', 'mediterranean', 'other').required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).optional()
  }).required(),
  contact: Joi.object({
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri().optional()
  }).required(),
  operatingHours: Joi.object().optional(),
  deliveryInfo: Joi.object({
    deliveryFee: Joi.number().min(0).optional(),
    minimumOrder: Joi.number().min(0).optional(),
    estimatedDeliveryTime: Joi.number().min(10).max(120).optional(),
    deliveryRadius: Joi.number().min(1).max(50).optional()
  }).optional()
});

// Get all restaurants with filters
router.get('/restaurants', async (req, res, next) => {
  try {
    const {
      cuisine,
      minRating,
      maxDeliveryTime,
      latitude,
      longitude,
      radius = 10,
      sortBy = 'rating.average',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (cuisine) {
      query.cuisine = cuisine;
    }
    
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }
    
    if (maxDeliveryTime) {
      query['deliveryInfo.estimatedDeliveryTime'] = { $lte: parseInt(maxDeliveryTime) };
    }

    // Location-based search
    if (latitude && longitude) {
      query['address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const restaurants = await Restaurant.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Restaurant.countDocuments(query);

    res.json({
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get restaurant by ID
router.get('/restaurants/:id', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select('-__v');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid restaurant ID' });
    }
    next(error);
  }
});

// Create restaurant (restaurant owner only)
router.post('/restaurants', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = createRestaurantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Only restaurant owners can create restaurants
    if (req.user.role !== 'restaurant_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only restaurant owners can create restaurants' });
    }

    const restaurant = new Restaurant({
      ...value,
      ownerId: req.user.id
    });

    await restaurant.save();

    // Publish restaurant created event
    await publishEvent('restaurant.created', {
      restaurantId: restaurant._id,
      ownerId: restaurant.ownerId,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      address: restaurant.address
    });

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant
    });
  } catch (error) {
    next(error);
  }
});

// Update restaurant
router.put('/restaurants/:id', authenticateToken, async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check ownership or admin
    if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error, value } = createRestaurantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    Object.assign(restaurant, value);
    await restaurant.save();

    // Publish restaurant updated event
    await publishEvent('restaurant.updated', {
      restaurantId: restaurant._id,
      ownerId: restaurant.ownerId,
      updatedFields: Object.keys(value)
    });

    res.json({
      message: 'Restaurant updated successfully',
      restaurant
    });
  } catch (error) {
    next(error);
  }
});

// Toggle restaurant active status
router.put('/restaurants/:id/toggle-status', authenticateToken, async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check ownership or admin
    if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    // Publish status change event
    await publishEvent('restaurant.status_changed', {
      restaurantId: restaurant._id,
      isActive: restaurant.isActive
    });

    res.json({
      message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: restaurant.isActive
    });
  } catch (error) {
    next(error);
  }
});

// Get restaurants by owner
router.get('/my-restaurants', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const restaurants = await Restaurant.find({ ownerId: req.user.id }).select('-__v');
    
    res.json(restaurants);
  } catch (error) {
    next(error);
  }
});

// Search restaurants
router.get('/restaurants/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    const searchRegex = new RegExp(query, 'i');

    const restaurants = await Restaurant.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { cuisine: searchRegex },
        { 'address.city': searchRegex }
      ]
    }).select('-__v').limit(20);

    res.json(restaurants);
  } catch (error) {
    next(error);
  }
});

module.exports = router;