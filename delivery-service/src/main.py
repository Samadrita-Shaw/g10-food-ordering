"""
FastAPI Delivery Service for Food Ordering System
Handles delivery tracking, driver management, and real-time location updates
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import motor.motor_asyncio
from bson import ObjectId
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="Delivery Service",
    description="Food Ordering Delivery Management Service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.delivery_service

# Pydantic models
class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class Driver(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str
    vehicle_type: str
    current_location: Location
    is_available: bool = True
    rating: float = Field(default=4.5, ge=0, le=5)

class DeliveryAddress(BaseModel):
    street: str
    city: str
    postal_code: str
    coordinates: Location

class Delivery(BaseModel):
    id: Optional[str] = None
    order_id: str
    driver_id: Optional[str] = None
    pickup_address: DeliveryAddress
    delivery_address: DeliveryAddress
    status: str = "pending"  # pending, assigned, picked_up, in_transit, delivered, cancelled
    estimated_delivery_time: Optional[datetime] = None
    actual_pickup_time: Optional[datetime] = None
    actual_delivery_time: Optional[datetime] = None
    tracking_number: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DeliveryUpdate(BaseModel):
    delivery_id: str
    status: str
    location: Optional[Location] = None
    estimated_time: Optional[int] = None  # minutes

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.delivery_subscribers: dict = {}

    async def connect(self, websocket: WebSocket, delivery_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if delivery_id:
            if delivery_id not in self.delivery_subscribers:
                self.delivery_subscribers[delivery_id] = []
            self.delivery_subscribers[delivery_id].append(websocket)

    def disconnect(self, websocket: WebSocket, delivery_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if delivery_id and delivery_id in self.delivery_subscribers:
            if websocket in self.delivery_subscribers[delivery_id]:
                self.delivery_subscribers[delivery_id].remove(websocket)

    async def send_delivery_update(self, delivery_id: str, message: dict):
        if delivery_id in self.delivery_subscribers:
            for connection in self.delivery_subscribers[delivery_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    await self.disconnect(connection, delivery_id)

manager = ConnectionManager()

# Helper functions
def serialize_delivery(delivery_doc):
    """Convert MongoDB document to Delivery model"""
    if delivery_doc:
        delivery_doc["id"] = str(delivery_doc["_id"])
        del delivery_doc["_id"]
        return delivery_doc
    return None

async def find_nearest_driver(pickup_location: Location) -> Optional[str]:
    """Find the nearest available driver"""
    drivers_cursor = db.drivers.find({"is_available": True})
    drivers = await drivers_cursor.to_list(length=100)
    
    if not drivers:
        return None
    
    # Simple distance calculation (in real-world, use proper geospatial queries)
    min_distance = float('inf')
    nearest_driver = None
    
    for driver in drivers:
        driver_lat = driver["current_location"]["latitude"]
        driver_lon = driver["current_location"]["longitude"]
        
        # Simple Euclidean distance (for demo purposes)
        distance = ((pickup_location.latitude - driver_lat) ** 2 + 
                   (pickup_location.longitude - driver_lon) ** 2) ** 0.5
        
        if distance < min_distance:
            min_distance = distance
            nearest_driver = driver
    
    return str(nearest_driver["_id"]) if nearest_driver else None

def calculate_eta(pickup_location: Location, delivery_location: Location) -> datetime:
    """Calculate estimated delivery time"""
    # Simple calculation: base time + distance factor
    base_time = 20  # base 20 minutes
    
    # Calculate distance (simplified)
    distance = ((delivery_location.latitude - pickup_location.latitude) ** 2 + 
               (delivery_location.longitude - pickup_location.longitude) ** 2) ** 0.5
    
    # Add time based on distance (rough approximation)
    additional_time = int(distance * 100)  # scale factor
    
    total_minutes = base_time + additional_time
    return datetime.utcnow() + timedelta(minutes=total_minutes)

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        await db.admin.command('ping')
        return {
            "status": "healthy",
            "service": "delivery-service",
            "timestamp": datetime.utcnow(),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/drivers", response_model=dict)
async def create_driver(driver: Driver):
    """Create a new driver"""
    try:
        driver_dict = driver.dict(exclude={"id"})
        result = await db.drivers.insert_one(driver_dict)
        
        driver_dict["id"] = str(result.inserted_id)
        if "_id" in driver_dict:
            del driver_dict["_id"]
        
        logger.info(f"Created driver: {driver_dict['id']}")
        return {"message": "Driver created", "driver": driver_dict}
    except Exception as e:
        logger.error(f"Error creating driver: {e}")
        raise HTTPException(status_code=500, detail="Failed to create driver")

@app.get("/drivers", response_model=List[dict])
async def get_drivers(available_only: bool = False):
    """Get all drivers or only available ones"""
    try:
        query = {"is_available": True} if available_only else {}
        drivers_cursor = db.drivers.find(query)
        drivers = await drivers_cursor.to_list(length=100)
        
        result = []
        for driver in drivers:
            driver["id"] = str(driver["_id"])
            del driver["_id"]
            result.append(driver)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching drivers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch drivers")

@app.post("/deliveries", response_model=dict)
async def create_delivery(delivery: Delivery):
    """Create a new delivery request"""
    try:
        delivery_dict = delivery.dict(exclude={"id"})
        
        # Try to assign a driver immediately
        driver_id = await find_nearest_driver(delivery.pickup_address.coordinates)
        if driver_id:
            delivery_dict["driver_id"] = driver_id
            delivery_dict["status"] = "assigned"
            
            # Mark driver as unavailable
            await db.drivers.update_one(
                {"_id": ObjectId(driver_id)},
                {"$set": {"is_available": False}}
            )
            
            # Calculate ETA
            eta = calculate_eta(
                delivery.pickup_address.coordinates,
                delivery.delivery_address.coordinates
            )
            delivery_dict["estimated_delivery_time"] = eta
        
        result = await db.deliveries.insert_one(delivery_dict)
        delivery_dict["id"] = str(result.inserted_id)
        
        logger.info(f"Created delivery: {delivery_dict['id']}")
        
        # Send real-time update
        await manager.send_delivery_update(delivery_dict["id"], {
            "type": "delivery_created",
            "delivery": serialize_delivery(delivery_dict)
        })
        
        return {"message": "Delivery created", "delivery": serialize_delivery(delivery_dict)}
    except Exception as e:
        logger.error(f"Error creating delivery: {e}")
        raise HTTPException(status_code=500, detail="Failed to create delivery")

@app.get("/deliveries/{delivery_id}", response_model=dict)
async def get_delivery(delivery_id: str):
    """Get delivery details by ID"""
    try:
        if not ObjectId.is_valid(delivery_id):
            raise HTTPException(status_code=400, detail="Invalid delivery ID")
        
        delivery = await db.deliveries.find_one({"_id": ObjectId(delivery_id)})
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        return serialize_delivery(delivery)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching delivery: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch delivery")

@app.get("/deliveries/order/{order_id}", response_model=dict)
async def get_delivery_by_order(order_id: str):
    """Get delivery details by order ID"""
    try:
        delivery = await db.deliveries.find_one({"order_id": order_id})
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery not found for this order")
        
        return serialize_delivery(delivery)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching delivery by order: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch delivery")

@app.put("/deliveries/{delivery_id}/status", response_model=dict)
async def update_delivery_status(delivery_id: str, update: DeliveryUpdate):
    """Update delivery status and location"""
    try:
        if not ObjectId.is_valid(delivery_id):
            raise HTTPException(status_code=400, detail="Invalid delivery ID")
        
        update_data = {
            "status": update.status,
            "updated_at": datetime.utcnow()
        }
        
        # Handle status-specific updates
        if update.status == "picked_up":
            update_data["actual_pickup_time"] = datetime.utcnow()
        elif update.status == "delivered":
            update_data["actual_delivery_time"] = datetime.utcnow()
            
            # Mark driver as available again
            delivery = await db.deliveries.find_one({"_id": ObjectId(delivery_id)})
            if delivery and delivery.get("driver_id"):
                await db.drivers.update_one(
                    {"_id": ObjectId(delivery["driver_id"])},
                    {"$set": {"is_available": True}}
                )
        
        result = await db.deliveries.update_one(
            {"_id": ObjectId(delivery_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        # Get updated delivery
        updated_delivery = await db.deliveries.find_one({"_id": ObjectId(delivery_id)})
        
        # Send real-time update
        await manager.send_delivery_update(delivery_id, {
            "type": "status_update",
            "delivery": serialize_delivery(updated_delivery),
            "location": update.location.dict() if update.location else None
        })
        
        logger.info(f"Updated delivery {delivery_id} status to {update.status}")
        return {"message": "Delivery updated", "delivery": serialize_delivery(updated_delivery)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating delivery: {e}")
        raise HTTPException(status_code=500, detail="Failed to update delivery")

@app.get("/deliveries/tracking/{tracking_number}", response_model=dict)
async def track_delivery(tracking_number: str):
    """Track delivery by tracking number"""
    try:
        delivery = await db.deliveries.find_one({"tracking_number": tracking_number})
        if not delivery:
            raise HTTPException(status_code=404, detail="Tracking number not found")
        
        # Get driver information if assigned
        driver_info = None
        if delivery.get("driver_id"):
            driver = await db.drivers.find_one({"_id": ObjectId(delivery["driver_id"])})
            if driver:
                driver_info = {
                    "name": driver["name"],
                    "phone": driver["phone"],
                    "vehicle_type": driver["vehicle_type"],
                    "current_location": driver["current_location"]
                }
        
        result = serialize_delivery(delivery)
        result["driver"] = driver_info
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking delivery: {e}")
        raise HTTPException(status_code=500, detail="Failed to track delivery")

# WebSocket endpoints
@app.websocket("/ws/delivery/{delivery_id}")
async def websocket_delivery_updates(websocket: WebSocket, delivery_id: str):
    """WebSocket endpoint for real-time delivery updates"""
    await manager.connect(websocket, delivery_id)
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(30)
            await websocket.ping()
    except WebSocketDisconnect:
        manager.disconnect(websocket, delivery_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, delivery_id)

# Background tasks and startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and create indexes"""
    try:
        # Create indexes for better performance
        await db.deliveries.create_index("order_id")
        await db.deliveries.create_index("tracking_number")
        await db.deliveries.create_index("status")
        await db.drivers.create_index([("current_location.latitude", 1), ("current_location.longitude", 1)])
        await db.drivers.create_index("is_available")
        
        logger.info("Delivery service started successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3005)