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
    await channel.assertExchange('user_events', 'topic', { durable: true });
    await channel.assertExchange('order_events', 'topic', { durable: true });

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
    // Create queue for order events that affect users
    const orderQueue = await channel.assertQueue('user_service_order_events', { durable: true });
    
    // Bind to order events
    await channel.bindQueue(orderQueue.queue, 'order_events', 'order.created');
    await channel.bindQueue(orderQueue.queue, 'order_events', 'order.completed');
    await channel.bindQueue(orderQueue.queue, 'order_events', 'order.cancelled');

    // Consume order events
    channel.consume(orderQueue.queue, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handleOrderEvent(event, msg.fields.routingKey);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing order event:', error);
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    });

    logger.info('Event handlers setup complete');
  } catch (error) {
    logger.error('Failed to setup event handlers:', error);
  }
};

const handleOrderEvent = async (event, eventType) => {
  logger.info(`Handling order event: ${eventType}`, event);
  
  // Here you could update user statistics, send notifications, etc.
  switch (eventType) {
    case 'order.created':
      // Update user order count, send confirmation email
      break;
    case 'order.completed':
      // Update user loyalty points, send completion notification
      break;
    case 'order.cancelled':
      // Send cancellation notification
      break;
  }
};

const publishEvent = async (eventType, data) => {
  if (!channel) {
    logger.warn('RabbitMQ channel not available, skipping event publication');
    return;
  }

  try {
    const event = {
      ...data,
      eventType,
      timestamp: new Date(),
      service: 'user-service'
    };

    await channel.publish(
      'user_events',
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