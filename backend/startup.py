# backend/startup.py
# Startup script that waits for database before starting the application
# This ensures the backend doesn't fail due to PostgreSQL not being ready

import time
import os
import sys
import logging
from sqlalchemy import create_engine, text, inspect

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_RETRIES = int(os.getenv("DB_STARTUP_RETRIES", "30"))
RETRY_DELAY = int(os.getenv("DB_STARTUP_DELAY", "2"))


def wait_for_db():
    """Wait for database to be ready before starting the app."""
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable not set!")
        return False
    
    logger.info(f"Waiting for database... (max {MAX_RETRIES} attempts)")
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Create engine with short timeout
            engine = create_engine(
                DATABASE_URL,
                connect_args={"connect_timeout": 5}
            )
            
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            logger.info(f"✓ Database ready on attempt {attempt}")
            return True
            
        except Exception as e:
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES}: Database not ready - {str(e)[:100]}")
            time.sleep(RETRY_DELAY)
    
    logger.error("WARNING: Database not ready after all retries, starting anyway...")
    logger.error("This may cause issues if database is truly unavailable")
    return False


def create_tables():
    """Create database tables if they don't exist."""
    from app.core.database import engine, Base
    from app.models import User, Studio, Resource, AvailabilityTemplate, AvailabilityException, Booking, EventLog
    
    # Log all tables that will be created
    logger.info(f"Tables to create: {list(Base.metadata.tables.keys())}")
    
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully or already exist")
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"Tables in database: {tables}")
        
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")


def main():
    """Main startup function."""
    logger.info("=" * 50)
    logger.info("Starting Studio Booking API...")
    logger.info("=" * 50)
    
    # Wait for database
    wait_for_db()
    
    # Create tables
    create_tables()
    
    # Start uvicorn
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=False
    )


if __name__ == "__main__":
    main()
