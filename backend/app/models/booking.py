# backend/app/models/booking.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Date, Time, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class BookingStatus(str, enum.Enum):
    """Enum for booking status"""
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Booking(Base):
    """
    Booking model - represents a booking request/reservation.
    """
    
    __tablename__ = "bookings"
    
    booking_id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.resource_id", ondelete="CASCADE"), nullable=False)
    studio_id = Column(Integer, ForeignKey("studios.studio_id", ondelete="CASCADE"), nullable=False)
    
    booking_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    
    status = Column(String(BookingStatus), default=BookingStatus.PENDING_APPROVAL, nullable=False, index=True)
    
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancel_reason = Column(Text, nullable=True)
    refund_percentage = Column(DECIMAL(5, 2), nullable=True)
    refund_amount = Column(DECIMAL(10, 2), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Booking #{self.booking_id} - {self.booking_date} {self.start_time}-{self.end_time}>"