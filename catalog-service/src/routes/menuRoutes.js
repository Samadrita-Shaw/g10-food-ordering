const express = require('express');
const Joi = require('joi');
const { MenuItem, Restaurant } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { publishEvent } = require('../utils/messageQueue');

const router = express.Router();

// Validation schemas
const createMenuItemSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('appetizer', 'main_course', 'dessert', 'beverage', 'salad', 'soup', 'pizza', 'pasta', 'burger', 'sandwich').required(),
  ingredients: Joi.array().items(Joi.string()).optional(),
  allergens: Joi.array().items(Joi.string()).optional(),
  nutritionalInfo: Joi.object({
    calories: Joi.number().min(0).optional(),
    protein: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional(),
    fiber: Joi.number().min(0).optional()
  }).optional(),
  dietaryInfo: Joi.object({
    vegetarian: Joi.boolean().optional(),
    vegan: Joi.boolean().optional(),
    glutenFree: Joi.boolean().optional(),
    dairyFree: Joi.boolean().optional(),
    nutFree: Joi.boolean().optional()
  }).optional(),
  preparationTime: Joi.number().min(1).max(120).optional(),
  customizations: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    options: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      priceModifier: Joi.number().required()
    })).required(),
    required: Joi.boolean().default(false),
    multiSelect: Joi.boolean().default(false)
  })).optional()
});

// Get menu items for a restaurant
router.get('/restaurants/:restaurantId/menu', async (req, res, next) => {
  try {
    const { category, vegetarian, vegan, glutenFree, maxPrice, available = true } = req.query;
    
    // Build query
    const query = { restaurantId: req.params.restaurantId };
    
    if (available !== 'false') {
      query.isAvailable = true;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (maxPrice) {
      query.price = { $lte: parseFloat(maxPrice) };
    }
    
    // Dietary filters
    if (vegetarian === 'true') {
      query['dietaryInfo.vegetarian'] = true;
    }
    
    if (vegan === 'true') {
      query['dietaryInfo.vegan'] = true;
    }
    
    if (glutenFree === 'true') {
      query['dietaryInfo.glutenFree'] = true;
    }

    const menuItems = await MenuItem.find(query)
      .sort({ category: 1, popularity: -1, name: 1 })
      .select('-__v');

    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});

// Get menu item by ID
router.get('/menu-items/:id', async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('restaurantId', 'name cuisine address contact')
      .select('-__v');
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid menu item ID' });
    }
    next(error);
  }
});

// Create menu item (restaurant owner only)
router.post('/restaurants/:restaurantId/menu', authenticateToken, async (req, res, next) => {
  try {
    // Verify restaurant exists and user owns it
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (restaurant.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error, value } = createMenuItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const menuItem = new MenuItem({
      ...value,
      restaurantId: req.params.restaurantId
    });

    await menuItem.save();

    // Publish menu item created event
    await publishEvent('menu_item.created', {
      menuItemId: menuItem._id,
      restaurantId: restaurant._id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price
    });

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    next(error);
  }
});

// Update menu item
router.put('/menu-items/:id', authenticateToken, async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurantId');
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check ownership
    if (menuItem.restaurantId.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error, value } = createMenuItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    Object.assign(menuItem, value);
    await menuItem.save();

    // Publish menu item updated event
    await publishEvent('menu_item.updated', {
      menuItemId: menuItem._id,
      restaurantId: menuItem.restaurantId._id,
      updatedFields: Object.keys(value)
    });

    res.json({
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    next(error);
  }
});

// Toggle menu item availability
router.put('/menu-items/:id/toggle-availability', authenticateToken, async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurantId');
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check ownership
    if (menuItem.restaurantId.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    // Publish availability change event
    await publishEvent('menu_item.availability_changed', {
      menuItemId: menuItem._id,
      restaurantId: menuItem.restaurantId._id,
      isAvailable: menuItem.isAvailable
    });

    res.json({
      message: `Menu item ${menuItem.isAvailable ? 'made available' : 'made unavailable'} successfully`,
      isAvailable: menuItem.isAvailable
    });
  } catch (error) {
    next(error);
  }
});

// Delete menu item
router.delete('/menu-items/:id', authenticateToken, async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurantId');
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check ownership
    if (menuItem.restaurantId.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    // Publish menu item deleted event
    await publishEvent('menu_item.deleted', {
      menuItemId: menuItem._id,
      restaurantId: menuItem.restaurantId._id,
      name: menuItem.name
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get menu categories for a restaurant
router.get('/restaurants/:restaurantId/menu/categories', async (req, res, next) => {
  try {
    const categories = await MenuItem.distinct('category', { 
      restaurantId: req.params.restaurantId,
      isAvailable: true 
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Search menu items
router.get('/menu-items/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    const { restaurantId } = req.query;
    const searchRegex = new RegExp(query, 'i');

    const searchQuery = {
      isAvailable: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { ingredients: { $in: [searchRegex] } }
      ]
    };

    if (restaurantId) {
      searchQuery.restaurantId = restaurantId;
    }

    const menuItems = await MenuItem.find(searchQuery)
      .populate('restaurantId', 'name')
      .select('-__v')
      .limit(50);

    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});

// Get popular menu items
router.get('/menu-items/popular', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const popularItems = await MenuItem.find({ isAvailable: true })
      .sort({ popularity: -1 })
      .limit(parseInt(limit))
      .populate('restaurantId', 'name cuisine rating')
      .select('-__v');

    res.json(popularItems);
  } catch (error) {
    next(error);
  }
});

module.exports = router;