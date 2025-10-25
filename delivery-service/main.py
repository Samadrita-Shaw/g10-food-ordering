from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

from app.routes import delivery_routes, driver_routes
from app.utils.message_queue import MessageQueue
from app.utils.auth import verify_token
from app.database import Database

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Food Ordering Delivery Service",
    description="Delivery tracking and driver management service",
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

# Security
security = HTTPBearer()

# Database instance
db = Database()
message_queue = MessageQueue()

@app.on_event("startup")
async def startup_event():
    """Initialize database and message queue connections on startup"""
    try:
        await db.connect()
        await message_queue.connect()
        logger.info("Delivery Service started successfully")
    except Exception as e:
        logger.error(f"Failed to start Delivery Service: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    await db.disconnect()
    await message_queue.disconnect()
    logger.info("Delivery Service shutdown complete")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "OK",
        "service": "delivery-service",
        "timestamp": datetime.utcnow().isoformat()
    }

# Dependency for database
async def get_database():
    return db

# Dependency for message queue
async def get_message_queue():
    return message_queue

# Include routers
app.include_router(
    delivery_routes.router,
    prefix="/api/delivery",
    tags=["delivery"],
    dependencies=[Depends(get_database), Depends(get_message_queue)]
)

app.include_router(
    driver_routes.router,
    prefix="/api/drivers",
    tags=["drivers"],
    dependencies=[Depends(get_database), Depends(get_message_queue)]
)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3005)),
        reload=os.getenv("PYTHON_ENV") == "development"
    )