# backend/main.py

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.core.database import engine, get_db, Base
from app.core.config import settings
from app.models import User, Studio, Resource, Booking, EventLog
from app.routes import auth, studio, resource, booking

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="API for studio booking application",
    version=settings.VERSION
)

# ============================================
# REGISTER ROUTERS
# ============================================
app.include_router(auth.router)  
app.include_router(studio.router)  
app.include_router(resource.router) 
app.include_router(booking.router)


# Test endpoint - Homepage
@app.get("/")
def read_root():
    return {
        "message": "Studio Booking API is running!",
        "version": settings.VERSION,
        "status": "success"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# TEST: Database connection endpoint
@app.get("/test-db")
def test_database(db: Session = Depends(get_db)):
    """
    Test if database connection works.
    """
    try:
        user_count = db.query(User).count()
        
        return {
            "status": "success",
            "message": "Database connection successful!",
            "user_count": user_count
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }
    

# Add this new endpoint at the end (before startup_event)
@app.get("/test-models")
def test_models(db: Session = Depends(get_db)):
    """
    Test if all models can query the database.
    """
    try:
        user_count = db.query(User).count()
        studio_count = db.query(Studio).count()
        resource_count = db.query(Resource).count()
        booking_count = db.query(Booking).count()
        log_count = db.query(EventLog).count()
        
        return {
            "status": "success",
            "message": "All models working!",
            "counts": {
                "users": user_count,
                "studios": studio_count,
                "resources": resource_count,
                "bookings": booking_count,
                "event_logs": log_count
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Model error: {str(e)}"
        }

# Startup event
@app.on_event("startup")
def startup_event():
    print("=" * 50)
    print("🚀 Studio Booking API Starting...")
    print(f"📊 Database: Connected to PostgreSQL")
    print(f"🔧 Environment: Development")
    print("=" * 50)