# backend/app/models/event_log.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class EventLog(Base):
    """
    Event Log model - audit trail for important events.
    """
    
    __tablename__ = "event_log"
    
    log_id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=True)
    studio_id = Column(Integer, ForeignKey("studios.studio_id"), nullable=True)
    
    event_type = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Changed from 'metadata' to 'meta_data' (metadata is reserved in SQLAlchemy)
    meta_data = Column(JSON, nullable=True)
    
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    def __repr__(self):
        return f"<EventLog {self.event_type} - {self.created_at}>"