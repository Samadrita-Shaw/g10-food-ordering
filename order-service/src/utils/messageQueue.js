const amqp = require('amqplib');
const winston = require('winston');

let connection = null;
let channel = null;

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

const connectRabbitMQ = async () => {
  try {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    // Create exchanges
    await channel.assertExchange('order_events', 'topic', { durable: true });
    await channel.assertExchange('payment_events', 'topic', { durable: true });
    await channel.assertExchange('delivery_events', 'topic', { durable: true });

    logger.info('Connected to RabbitMQ');
    
    // Setup event handlers
    await setupEventHandlers();
    
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    setTimeout(connectRabbitMQ, 5000); // Retry after 5 seconds
  }
};

const setupEventHandlers = async () => {
  try {
    // Create queue for payment events
    const paymentQueue = await channel.assertQueue('order_service_payment_events', { durable: true });
    
    // Bind to payment events
    await channel.bindQueue(paymentQueue.queue, 'payment_events', 'payment.processed');
    await channel.bindQueue(paymentQueue.queue, 'payment_events', 'payment.failed');
    await channel.bindQueue(paymentQueue.queue, 'payment_events', 'payment.refunded');

    // Create queue for delivery events
    const deliveryQueue = await channel.assertQueue('order_service_delivery_events', { durable: true });
    
    // Bind to delivery events
    await channel.bindQueue(deliveryQueue.queue, 'delivery_events', 'delivery.assigned');
    await channel.bindQueue(deliveryQueue.queue, 'delivery_events', 'delivery.picked_up');
    await channel.bindQueue(deliveryQueue.queue, 'delivery_events', 'delivery.completed');

    // Consume payment events
    channel.consume(paymentQueue.queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handlePaymentEvent(event, msg.fields.routingKey);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing payment event:', error);
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    });

    // Consume delivery events
    channel.consume(deliveryQueue.queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handleDeliveryEvent(event, msg.fields.routingKey);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing delivery event:', error);
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    });

    logger.info('Event handlers setup complete');
  } catch (error) {
    logger.error('Failed to setup event handlers:', error);
  }
};

const handlePaymentEvent = async (event, eventType) => {
  logger.info(`Handling payment event: ${eventType}`, event);
  
  const { Order } = require('../models');
  const OrderSaga = require('../saga/OrderSaga');
  
  switch (eventType) {
    case 'payment.processed':
      // Continue saga to next step
      const saga = new OrderSaga();
      await saga.executeStep(event.orderId, 'notify_restaurant');
      break;
    case 'payment.failed':
      // Start compensation
      await Order.update(
        { status: 'failed', sagaStatus: 'compensating' },
        { where: { id: event.orderId } }
      );
      break;
    case 'payment.refunded':
      // Update order status
      await Order.update(
        { 
          status: 'cancelled',
          metadata: {
            refundProcessed: true,
            refundAmount: event.refundAmount
          }
        },
        { where: { id: event.orderId } }
      );
      break;
  }
};

const handleDeliveryEvent = async (event, eventType) => {
  logger.info(`Handling delivery event: ${eventType}`, event);
  
  const { Order } = require('../models');
  
  switch (eventType) {
    case 'delivery.assigned':
      await Order.update(
        { status: 'out_for_delivery' },
        { where: { id: event.orderId } }
      );
      break;
    case 'delivery.picked_up':
      await Order.update(
        { status: 'on_the_way' },
        { where: { id: event.orderId } }
      );
      break;
    case 'delivery.completed':
      await Order.update(
        { 
          status: 'delivered',
          actualDeliveryTime: new Date(),
          sagaStatus: 'completed'
        },
        { where: { id: event.orderId } }
      );
      break;
  }
};

const publishEvent = async (eventType, data) => {
  if (!channel) {
    logger.error('RabbitMQ channel not available');
    return;
  }

  try {
    const event = {
      ...data,
      eventType,
      timestamp: new Date(),
      service: 'order-service'
    };

    await channel.publish(
      'order_events',
      eventType,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    logger.info(`Published event: ${eventType}`, event);
  } catch (error) {
    logger.error('Failed to publish event:', error);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (channel) await channel.close();
  if (connection) await connection.close();
});

module.exports = {
  connectRabbitMQ,
  publishEvent
};