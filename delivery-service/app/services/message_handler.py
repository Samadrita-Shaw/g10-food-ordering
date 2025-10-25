"""
Message Handler for RabbitMQ Integration
"""
import asyncio
import json
import pika
import os
from datetime import datetime
from typing import Dict, Any

class MessageHandler:
    def __init__(self, delivery_service):
        self.delivery_service = delivery_service
        self.connection = None
        self.channel = None
        self.consuming = False
        
    async def connect(self):
        """Connect to RabbitMQ"""
        try:
            rabbitmq_url = os.getenv("RABBITMQ_URL", "amqp://localhost:5672")
            self.connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
            self.channel = self.connection.channel()
            
            # Declare exchanges and queues
            self.channel.exchange_declare(exchange='food_ordering', exchange_type='topic')
            
            # Declare queue for delivery events
            self.channel.queue_declare(queue='delivery_events', durable=True)
            self.channel.queue_bind(
                exchange='food_ordering',
                queue='delivery_events',
                routing_key='order.*'
            )
            
            print("✅ Connected to RabbitMQ")
            return True
            
        except Exception as e:
            print(f"❌ Failed to connect to RabbitMQ: {str(e)}")
            return False
    
    async def start_consuming(self):
        """Start consuming messages"""
        if not await self.connect():
            return
        
        self.consuming = True
        
        def message_callback(ch, method, properties, body):
            try:
                message = json.loads(body)
                asyncio.create_task(self.handle_message(message, method.routing_key))
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                print(f"❌ Error processing message: {str(e)}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
        self.channel.basic_consume(
            queue='delivery_events',
            on_message_callback=message_callback
        )
        
        print("📡 Started consuming messages...")
        
        # Start consuming in a separate thread
        def consume_loop():
            while self.consuming:
                try:
                    self.connection.process_data_events(time_limit=1)
                except Exception as e:
                    print(f"❌ Error in consume loop: {str(e)}")
                    break
        
        import threading
        consume_thread = threading.Thread(target=consume_loop)
        consume_thread.daemon = True
        consume_thread.start()
    
    async def handle_message(self, message: Dict[str, Any], routing_key: str):
        """Handle incoming messages"""
        try:
            event_type = message.get("event_type")
            
            if event_type == "order_confirmed":
                await self.handle_order_confirmed(message)
            elif event_type == "payment_successful":
                await self.handle_payment_successful(message)
            elif event_type == "order_cancelled":
                await self.handle_order_cancelled(message)
            
            print(f"✅ Processed {event_type} event for order {message.get('order_id')}")
            
        except Exception as e:
            print(f"❌ Error handling message: {str(e)}")
    
    async def handle_order_confirmed(self, message: Dict[str, Any]):
        """Handle order confirmed event"""
        order_data = message.get("order", {})
        
        # Create delivery for confirmed order
        delivery_data = {
            "order_id": order_data.get("id"),
            "customer_id": order_data.get("customer_id"),
            "restaurant_id": order_data.get("restaurant_id"),
            "pickup_address": order_data.get("restaurant_address", {}),
            "delivery_address": order_data.get("delivery_address", {}),
            "customer_phone": order_data.get("customer_phone"),
            "delivery_instructions": order_data.get("delivery_instructions")
        }
        
        delivery = await self.delivery_service.create_delivery(delivery_data)
        
        # Publish delivery created event
        await self.publish_event("delivery_created", {
            "delivery_id": delivery["_id"],
            "order_id": delivery["order_id"],
            "status": delivery["status"],
            "estimated_delivery_time": delivery.get("estimated_delivery_time").isoformat() if delivery.get("estimated_delivery_time") else None
        })
    
    async def handle_payment_successful(self, message: Dict[str, Any]):
        """Handle successful payment event"""
        order_id = message.get("order_id")
        
        # Find delivery for this order and update status
        delivery = await self.delivery_service.get_delivery_by_order(order_id)
        if delivery:
            await self.delivery_service.update_delivery(delivery["_id"], {"status": "confirmed"})
    
    async def handle_order_cancelled(self, message: Dict[str, Any]):
        """Handle order cancellation event"""
        order_id = message.get("order_id")
        
        # Find delivery for this order and cancel it
        delivery = await self.delivery_service.get_delivery_by_order(order_id)
        if delivery:
            await self.delivery_service.update_delivery(delivery["_id"], {"status": "cancelled"})
            
            # Publish delivery cancelled event
            await self.publish_event("delivery_cancelled", {
                "delivery_id": delivery["_id"],
                "order_id": order_id,
                "reason": "Order cancelled"
            })
    
    async def publish_event(self, event_type: str, data: Dict[str, Any]):
        """Publish event to message queue"""
        try:
            if not self.channel:
                await self.connect()
            
            message = {
                "event_type": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                **data
            }
            
            routing_key = f"delivery.{event_type}"
            
            self.channel.basic_publish(
                exchange='food_ordering',
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    timestamp=int(datetime.utcnow().timestamp())
                )
            )
            
            print(f"📤 Published {event_type} event")
            
        except Exception as e:
            print(f"❌ Failed to publish event: {str(e)}")
    
    async def stop_consuming(self):
        """Stop consuming messages"""
        self.consuming = False
        if self.connection and not self.connection.is_closed:
            self.connection.close()
        print("🔌 Disconnected from RabbitMQ")