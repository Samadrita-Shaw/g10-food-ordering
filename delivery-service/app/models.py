from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DeliveryStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    ON_THE_WAY = "on_the_way"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    FAILED = "failed"

class DriverStatus(str, Enum):
    OFFLINE = "offline"
    AVAILABLE = "available"
    BUSY = "busy"
    ON_BREAK = "on_break"

class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DeliveryAddress(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    coordinates: Location
    instructions: Optional[str] = None

class Driver(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    name: str
    phone: str
    email: str
    license_number: str
    vehicle_info: dict
    status: DriverStatus = DriverStatus.OFFLINE
    current_location: Optional[Location] = None
    rating: float = Field(default=0.0, ge=0, le=5)
    total_deliveries: int = 0
    total_earnings: float = 0.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class Delivery(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    order_id: str
    restaurant_id: str
    driver_id: Optional[str] = None
    customer_id: str
    pickup_address: DeliveryAddress
    delivery_address: DeliveryAddress
    status: DeliveryStatus = DeliveryStatus.PENDING
    estimated_pickup_time: Optional[datetime] = None
    actual_pickup_time: Optional[datetime] = None
    estimated_delivery_time: Optional[datetime] = None
    actual_delivery_time: Optional[datetime] = None
    delivery_fee: float = 0.0
    driver_earnings: float = 0.0
    current_location: Optional[Location] = None
    delivery_instructions: Optional[str] = None
    delivery_proof: Optional[str] = None  # Photo URL
    customer_notes: Optional[str] = None
    driver_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class DeliveryCreate(BaseModel):
    order_id: str
    restaurant_id: str
    customer_id: str
    pickup_address: DeliveryAddress
    delivery_address: DeliveryAddress
    estimated_delivery_time: Optional[datetime] = None
    delivery_fee: float = 0.0
    delivery_instructions: Optional[str] = None

class DeliveryUpdate(BaseModel):
    status: Optional[DeliveryStatus] = None
    current_location: Optional[Location] = None
    delivery_proof: Optional[str] = None
    customer_notes: Optional[str] = None
    driver_notes: Optional[str] = None

class DriverCreate(BaseModel):
    user_id: str
    name: str
    phone: str
    email: str
    license_number: str
    vehicle_info: dict

class DriverUpdate(BaseModel):
    status: Optional[DriverStatus] = None
    current_location: Optional[Location] = None
    vehicle_info: Optional[dict] = None

class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None