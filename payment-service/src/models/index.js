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

// Payment Model
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    ),
    defaultValue: 'pending'
  },
  method: {
    type: DataTypes.ENUM(
      'credit_card',
      'debit_card',
      'paypal',
      'apple_pay',
      'google_pay',
      'bank_transfer'
    ),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING,
    unique: true
  },
  gatewayResponse: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  failureReason: {
    type: DataTypes.STRING
  },
  refundedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'payments',
  timestamps: true
});

// Refund Model
const Refund = sequelize.define('Refund', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  paymentId: {
    type: DataTypes.UUID,
    references: {
      model: Payment,
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  refundTransactionId: {
    type: DataTypes.STRING
  },
  processedBy: {
    type: DataTypes.STRING
  },
  gatewayResponse: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'refunds',
  timestamps: true
});

// Payment Method Model (for storing user payment methods)
const PaymentMethod = sequelize.define('PaymentMethod', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'credit_card',
      'debit_card',
      'paypal',
      'apple_pay',
      'google_pay',
      'bank_account'
    ),
    allowNull: false
  },
  lastFour: {
    type: DataTypes.STRING(4)
  },
  brand: {
    type: DataTypes.STRING // Visa, Mastercard, etc.
  },
  expiryMonth: {
    type: DataTypes.INTEGER
  },
  expiryYear: {
    type: DataTypes.INTEGER
  },
  cardholderName: {
    type: DataTypes.STRING
  },
  billingAddress: {
    type: DataTypes.JSONB
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  gatewayTokenId: {
    type: DataTypes.STRING // Token from payment gateway
  }
}, {
  tableName: 'payment_methods',
  timestamps: true
});

// Define associations
Payment.hasMany(Refund, { foreignKey: 'paymentId', as: 'refunds' });
Refund.belongsTo(Payment, { foreignKey: 'paymentId' });

Payment.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
PaymentMethod.hasMany(Payment, { foreignKey: 'paymentMethodId' });

module.exports = {
  sequelize,
  Payment,
  Refund,
  PaymentMethod
};