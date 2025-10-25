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
    await channel.assertExchange('catalog_events', 'topic', { durable: true });
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
    // Create queue for order events that affect catalog
    const orderQueue = await channel.assertQueue('catalog_service_order_events', { durable: true });
    
    // Bind to order events
    await channel.bindQueue(orderQueue.queue, 'order_events', 'order.created');
    await channel.bindQueue(orderQueue.queue, 'order_events', 'order.completed');

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
  
  const { MenuItem } = require('../models');
  
  switch (eventType) {
    case 'order.created':
      // Update menu item popularity
      if (event.items) {
        for (const item of event.items) {
          await MenuItem.findByIdAndUpdate(
            item.menuItemId,
            { $inc: { popularity: item.quantity } }
          );
        }
      }
      break;
    case 'order.completed':
      // Further update popularity or analytics
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
      service: 'catalog-service'
    };

    await channel.publish(
      'catalog_events',
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