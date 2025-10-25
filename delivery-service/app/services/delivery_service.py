"""
Delivery Service Implementation
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bson import ObjectId
import json

class DeliveryService:
    def __init__(self, database):
        self.db = database
        self.deliveries_collection = database.deliveries
        self.drivers_collection = database.drivers
        
    async def create_delivery(self, delivery_data: dict) -> dict:
        """Create a new delivery"""
        delivery = {
            "_id": ObjectId(),
            "order_id": delivery_data["order_id"],
            "customer_id": delivery_data["customer_id"],
            "restaurant_id": delivery_data["restaurant_id"],
            "pickup_address": delivery_data["pickup_address"],
            "delivery_address": delivery_data["delivery_address"],
            "customer_phone": delivery_data.get("customer_phone"),
            "delivery_instructions": delivery_data.get("delivery_instructions"),
            "status": "pending",  # pending, assigned, picked_up, in_transit, delivered, cancelled
            "driver_id": None,
            "estimated_delivery_time": None,
            "actual_delivery_time": None,
            "current_location": None,
            "tracking_history": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Assign available driver
        available_driver = await self.find_available_driver(delivery_data["pickup_address"])
        if available_driver:
            delivery["driver_id"] = available_driver["_id"]
            delivery["status"] = "assigned"
            delivery["estimated_delivery_time"] = datetime.utcnow() + timedelta(minutes=30)
            
            # Update driver status
            await self.drivers_collection.update_one(
                {"_id": available_driver["_id"]},
                {"$set": {"status": "busy", "current_delivery_id": delivery["_id"]}}
            )
        
        result = await self.deliveries_collection.insert_one(delivery)
        delivery["_id"] = str(delivery["_id"])
        
        # Add to tracking history
        await self.add_tracking_event(delivery["_id"], "created", "Delivery created")
        
        return delivery
    
    async def get_delivery(self, delivery_id: str) -> Optional[dict]:
        """Get delivery by ID"""
        try:
            delivery = await self.deliveries_collection.find_one({"_id": ObjectId(delivery_id)})
            if delivery:
                delivery["_id"] = str(delivery["_id"])
                if delivery.get("driver_id"):
                    delivery["driver_id"] = str(delivery["driver_id"])
            return delivery
        except:
            return None
    
    async def get_deliveries(self, filters: dict, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get deliveries with filters"""
        query = {}
        if filters.get("status"):
            query["status"] = filters["status"]
        if filters.get("driver_id"):
            query["driver_id"] = ObjectId(filters["driver_id"])
        
        cursor = self.deliveries_collection.find(query).skip(skip).limit(limit)
        deliveries = []
        
        async for delivery in cursor:
            delivery["_id"] = str(delivery["_id"])
            if delivery.get("driver_id"):
                delivery["driver_id"] = str(delivery["driver_id"])
            deliveries.append(delivery)
        
        return deliveries
    
    async def update_delivery(self, delivery_id: str, update_data: dict) -> Optional[dict]:
        """Update delivery"""
        try:
            update_data["updated_at"] = datetime.utcnow()
            
            # Handle status changes
            if "status" in update_data:
                await self.handle_status_change(delivery_id, update_data["status"])
            
            result = await self.deliveries_collection.update_one(
                {"_id": ObjectId(delivery_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return await self.get_delivery(delivery_id)
            return None
        except:
            return None
    
    async def update_delivery_location(self, delivery_id: str, latitude: float, longitude: float) -> bool:
        """Update delivery current location"""
        try:
            location = {
                "latitude": latitude,
                "longitude": longitude,
                "timestamp": datetime.utcnow()
            }
            
            result = await self.deliveries_collection.update_one(
                {"_id": ObjectId(delivery_id)},
                {
                    "$set": {
                        "current_location": location,
                        "updated_at": datetime.utcnow()
                    },
                    "$push": {
                        "tracking_history": {
                            "event": "location_update",
                            "location": location,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
            
            return result.modified_count > 0
        except:
            return False
    
    async def get_delivery_tracking(self, delivery_id: str) -> Optional[dict]:
        """Get delivery tracking information"""
        delivery = await self.get_delivery(delivery_id)
        if not delivery:
            return None
        
        # Get driver information if assigned
        driver_info = None
        if delivery.get("driver_id"):
            driver = await self.drivers_collection.find_one({"_id": ObjectId(delivery["driver_id"])})
            if driver:
                driver_info = {
                    "id": str(driver["_id"]),
                    "name": driver["name"],
                    "phone": driver["phone"],
                    "vehicle_info": driver.get("vehicle_info")
                }
        
        return {
            "delivery_id": delivery_id,
            "status": delivery["status"],
            "current_location": delivery.get("current_location"),
            "estimated_delivery_time": delivery.get("estimated_delivery_time"),
            "driver": driver_info,
            "tracking_history": delivery.get("tracking_history", [])
        }
    
    async def get_delivery_by_order(self, order_id: str) -> Optional[dict]:
        """Get delivery by order ID"""
        delivery = await self.deliveries_collection.find_one({"order_id": order_id})
        if delivery:
            delivery["_id"] = str(delivery["_id"])
            if delivery.get("driver_id"):
                delivery["driver_id"] = str(delivery["driver_id"])
        return delivery
    
    async def find_available_driver(self, pickup_address: dict) -> Optional[dict]:
        """Find available driver near pickup location"""
        # Simple implementation - find any available driver
        # In production, this would use geospatial queries
        driver = await self.drivers_collection.find_one({
            "status": "available",
            "is_online": True
        })
        return driver
    
    async def get_available_drivers(self) -> List[dict]:
        """Get list of available drivers"""
        cursor = self.drivers_collection.find({
            "status": "available",
            "is_online": True
        })
        
        drivers = []
        async for driver in cursor:
            drivers.append({
                "id": str(driver["_id"]),
                "name": driver["name"],
                "phone": driver["phone"],
                "current_location": driver.get("current_location"),
                "vehicle_info": driver.get("vehicle_info")
            })
        
        return drivers
    
    async def update_driver_status(self, driver_id: str, status: str) -> bool:
        """Update driver status"""
        try:
            result = await self.drivers_collection.update_one(
                {"_id": ObjectId(driver_id)},
                {"$set": {"status": status, "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except:
            return False
    
    async def handle_status_change(self, delivery_id: str, new_status: str):
        """Handle delivery status changes"""
        status_messages = {
            "assigned": "Driver assigned to delivery",
            "picked_up": "Order picked up from restaurant",
            "in_transit": "On the way to delivery address",
            "delivered": "Order delivered successfully",
            "cancelled": "Delivery cancelled"
        }
        
        message = status_messages.get(new_status, f"Status updated to {new_status}")
        await self.add_tracking_event(delivery_id, new_status, message)
        
        # Handle driver status when delivery is completed
        if new_status in ["delivered", "cancelled"]:
            delivery = await self.get_delivery(delivery_id)
            if delivery and delivery.get("driver_id"):
                await self.drivers_collection.update_one(
                    {"_id": ObjectId(delivery["driver_id"])},
                    {
                        "$set": {"status": "available"},
                        "$unset": {"current_delivery_id": ""}
                    }
                )
        
        # Set actual delivery time for completed deliveries
        if new_status == "delivered":
            await self.deliveries_collection.update_one(
                {"_id": ObjectId(delivery_id)},
                {"$set": {"actual_delivery_time": datetime.utcnow()}}
            )
    
    async def add_tracking_event(self, delivery_id: str, event: str, description: str):
        """Add event to delivery tracking history"""
        try:
            await self.deliveries_collection.update_one(
                {"_id": ObjectId(delivery_id)},
                {
                    "$push": {
                        "tracking_history": {
                            "event": event,
                            "description": description,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
        except:
            pass
    
    async def get_delivery_statistics(self) -> dict:
        """Get delivery statistics"""
        try:
            total_deliveries = await self.deliveries_collection.count_documents({})
            completed_deliveries = await self.deliveries_collection.count_documents({"status": "delivered"})
            pending_deliveries = await self.deliveries_collection.count_documents({"status": {"$nin": ["delivered", "cancelled"]}})
            active_drivers = await self.drivers_collection.count_documents({"status": "busy"})
            available_drivers = await self.drivers_collection.count_documents({"status": "available", "is_online": True})
            
            # Calculate average delivery time
            pipeline = [
                {"$match": {"status": "delivered", "actual_delivery_time": {"$exists": True}}},
                {"$project": {
                    "delivery_time_minutes": {
                        "$divide": [
                            {"$subtract": ["$actual_delivery_time", "$created_at"]},
                            60000  # Convert to minutes
                        ]
                    }
                }},
                {"$group": {
                    "_id": None,
                    "avg_delivery_time": {"$avg": "$delivery_time_minutes"}
                }}
            ]
            
            avg_result = await self.deliveries_collection.aggregate(pipeline).to_list(1)
            avg_delivery_time = avg_result[0]["avg_delivery_time"] if avg_result else 0
            
            return {
                "total_deliveries": total_deliveries,
                "completed_deliveries": completed_deliveries,
                "pending_deliveries": pending_deliveries,
                "active_drivers": active_drivers,
                "available_drivers": available_drivers,
                "average_delivery_time_minutes": round(avg_delivery_time, 2),
                "completion_rate": round((completed_deliveries / total_deliveries * 100), 2) if total_deliveries > 0 else 0
            }
        except Exception as e:
            return {"error": str(e)}