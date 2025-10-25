const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    required: true,
    enum: ['italian', 'chinese', 'indian', 'mexican', 'american', 'thai', 'japanese', 'mediterranean', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  operatingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  deliveryInfo: {
    deliveryFee: { type: Number, default: 0 },
    minimumOrder: { type: Number, default: 0 },
    estimatedDeliveryTime: { type: Number, default: 30 }, // minutes
    deliveryRadius: { type: Number, default: 5 } // km
  },
  images: [{
    url: String,
    alt: String,
    type: { type: String, enum: ['logo', 'cover', 'interior', 'food'] }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
restaurantSchema.index({ "address.coordinates": "2dsphere" });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ "rating.average": -1 });
restaurantSchema.index({ isActive: 1 });

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizer', 'main_course', 'dessert', 'beverage', 'salad', 'soup', 'pizza', 'pasta', 'burger', 'sandwich']
  },
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  dietaryInfo: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    dairyFree: { type: Boolean, default: false },
    nutFree: { type: Boolean, default: false }
  },
  images: [{
    url: String,
    alt: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15 // minutes
  },
  popularity: {
    type: Number,
    default: 0
  },
  customizations: [{
    name: String,
    options: [{
      name: String,
      priceModifier: Number // can be negative for discounts
    }],
    required: Boolean,
    multiSelect: Boolean
  }]
}, {
  timestamps: true
});

menuItemSchema.index({ restaurantId: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ price: 1 });

module.exports = {
  Restaurant: mongoose.model('Restaurant', restaurantSchema),
  MenuItem: mongoose.model('MenuItem', menuItemSchema)
};