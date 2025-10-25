const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { publishEvent } = require('../utils/messageQueue');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  phone: Joi.string().optional(),
  preferences: Joi.object({
    cuisine: Joi.array().items(Joi.string()).optional(),
    dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional()
    }).optional()
  }).optional()
});

const addAddressSchema = Joi.object({
  type: Joi.string().valid('home', 'work', 'other').default('home'),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  coordinates: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).optional()
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Publish profile update event
    await publishEvent('user.profile_updated', {
      userId: user._id,
      updatedFields: Object.keys(value),
      timestamp: new Date()
    });

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// Add address
router.post('/addresses', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = addAddressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.addresses.push(value);
    await user.save();

    res.status(201).json({
      message: 'Address added successfully',
      address: value
    });
  } catch (error) {
    next(error);
  }
});

// Get user addresses
router.get('/addresses', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
});

// Update address
router.put('/addresses/:addressId', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = addAddressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    Object.assign(address, value);
    await user.save();

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    next(error);
  }
});

// Delete address
router.delete('/addresses/:addressId', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.addresses.pull({ _id: req.params.addressId });
    await user.save();

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get user by ID (admin only)
router.get('/:userId', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

// Deactivate user account
router.put('/deactivate', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive: false },
      { new: true }
    );

    // Publish account deactivation event
    await publishEvent('user.account_deactivated', {
      userId: user._id,
      email: user.email,
      timestamp: new Date()
    });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;