from motor.motor_asyncio import AsyncIOMotorClient
import logging
import os

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

    async def connect(self):
        """Create database connection"""
        try:
            mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/delivery_service")
            self.client = AsyncIOMotorClient(mongodb_url)
            
            # Get database name from URL or use default
            db_name = mongodb_url.split('/')[-1].split('?')[0] or "delivery_service"
            self.database = self.client[db_name]
            
            # Test connection
            await self.client.admin.command('ismaster')
            logger.info("Connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    async def disconnect(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    def get_collection(self, collection_name: str):
        """Get a collection from the database"""
        if not self.database:
            raise Exception("Database not connected")
        return self.database[collection_name]