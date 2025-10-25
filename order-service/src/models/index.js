const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.POSTGRES_URL || 'postgresql://localhost:5432/food_ordering', {
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Order Model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  restaurantId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'failed'
    ),
    defaultValue: 'pending'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  deliveryAddress: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  estimatedDeliveryTime: {
    type: DataTypes.DATE
  },
  actualDeliveryTime: {
    type: DataTypes.DATE
  },
  cancelReason: {
    type: DataTypes.STRING
  },
  sagaStatus: {
    type: DataTypes.ENUM(
      'started',
      'payment_processing',
      'payment_confirmed',
      'restaurant_notified',
      'delivery_assigned',
      'completed',
      'compensating',
      'compensated',
      'failed'
    ),
    defaultValue: 'started'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'orders',
  timestamps: true
});

// Order Item Model
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    references: {
      model: Order,
      key: 'id'
    }
  },
  menuItemId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  specialInstructions: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'order_items',
  timestamps: true
});

// Saga Transaction Log Model (for tracking saga steps)
const SagaTransaction = sequelize.define('SagaTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    references: {
      model: Order,
      key: 'id'
    }
  },
  step: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'compensated'),
    defaultValue: 'pending'
  },
  requestData: {
    type: DataTypes.JSONB
  },
  responseData: {
    type: DataTypes.JSONB
  },
  error: {
    type: DataTypes.TEXT
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  }
}, {
  tableName: 'saga_transactions',
  timestamps: true
});

// Define associations
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasMany(SagaTransaction, { foreignKey: 'orderId', as: 'sagaTransactions' });
SagaTransaction.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = {
  sequelize,
  Order,
  OrderItem,
  SagaTransaction
};