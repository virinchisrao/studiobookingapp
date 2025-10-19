# backend/app/models/availability.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Time, Date, DECIMAL, Text
from sqlalchemy.sql import func
from app.core.database import Base


class AvailabilityTemplate(Base):
    """
    Weekly availability schedule for a resource.
    """
    
    __tablename__ = "availability_template"
    
    template_id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.resource_id", ondelete="CASCADE"), nullable=False)
    
    day_of_week = Column(Integer, nullable=False)
    open_time = Column(Time, nullable=False)
    close_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return f"<Availability {days[self.day_of_week]} {self.open_time}-{self.close_time}>"


class AvailabilityException(Base):
    """
    Exceptions to the regular schedule.
    """
    
    __tablename__ = "availability_exception"
    
    exception_id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.resource_id", ondelete="CASCADE"), nullable=False)
    
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_available = Column(Boolean, default=False)
    reason = Column(String(255), nullable=True)
    override_price = Column(DECIMAL(10, 2), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Exception {self.date} - {self.reason}>"