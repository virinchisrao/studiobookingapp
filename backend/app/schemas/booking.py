# backend/app/schemas/booking.py

from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date, time
from typing import Optional
from decimal import Decimal

# ============================================
# BOOKING CREATE SCHEMA
# ============================================
class BookingCreate(BaseModel):
    """
    Schema for creating a new booking request.
    Customer selects resource, date, and time slots.
    """
    resource_id: int
    booking_date: date
    start_time: time
    end_time: time
    
    @field_validator('booking_date')
    def validate_date(cls, v):
        """Ensure booking date is not in the past"""
        if v < date.today():
            raise ValueError('Booking date cannot be in the past')
        return v
    
    @field_validator('end_time')
    def validate_time_range(cls, v, info):
        """Ensure end_time is after start_time"""
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('End time must be after start time')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "resource_id": 1,
                "booking_date": "2025-01-20",
                "start_time": "14:00:00",
                "end_time": "16:00:00"
            }
        }


# ============================================
# BOOKING RESPONSE SCHEMA
# ============================================
class BookingResponse(BaseModel):
    """
    Schema for booking data in API responses.
    """
    booking_id: int
    user_id: int
    resource_id: int
    studio_id: int
    booking_date: date
    start_time: time
    end_time: time
    duration_minutes: int
    status: str
    total_amount: Decimal
    currency: str
    approved_at: Optional[datetime]
    approved_by: Optional[int]
    rejection_reason: Optional[str]
    cancelled_at: Optional[datetime]
    cancel_reason: Optional[str]
    refund_percentage: Optional[Decimal]
    refund_amount: Optional[Decimal]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "booking_id": 1,
                "user_id": 1,
                "resource_id": 1,
                "studio_id": 1,
                "booking_date": "2025-01-20",
                "start_time": "14:00:00",
                "end_time": "16:00:00",
                "duration_minutes": 120,
                "status": "pending_approval",
                "total_amount": 3000.00,
                "currency": "INR",
                "created_at": "2025-01-15T10:30:00"
            }
        }


# ============================================
# BOOKING APPROVAL SCHEMA
# ============================================
class BookingApproval(BaseModel):
    """
    Schema for owner to approve or reject a booking.
    """
    approve: bool  # True = approve, False = reject
    rejection_reason: Optional[str] = None
    
    @field_validator('rejection_reason')
    def validate_rejection_reason(cls, v, info):
        """If rejecting, reason is required"""
        if 'approve' in info.data and not info.data['approve'] and not v:
            raise ValueError('Rejection reason is required when rejecting a booking')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "approve": True,
                "rejection_reason": None
            }
        }


# ============================================
# BOOKING CANCELLATION SCHEMA
# ============================================
class BookingCancellation(BaseModel):
    """
    Schema for customer to cancel a booking.
    """
    cancel_reason: str = Field(..., min_length=5, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "cancel_reason": "Unable to attend due to schedule conflict"
            }
        }


# ============================================
# AVAILABLE SLOTS RESPONSE
# ============================================
class TimeSlot(BaseModel):
    """
    Represents a single 30-minute time slot.
    """
    start_time: time
    end_time: time
    is_available: bool
    price: Decimal
    
    class Config:
        json_schema_extra = {
            "example": {
                "start_time": "14:00:00",
                "end_time": "14:30:00",
                "is_available": True,
                "price": 750.00
            }
        }


class AvailableSlotsResponse(BaseModel):
    """
    Response showing all available time slots for a specific date.
    """
    resource_id: int
    date: date
    slots: list[TimeSlot]
    
    class Config:
        json_schema_extra = {
            "example": {
                "resource_id": 1,
                "date": "2025-01-20",
                "slots": [
                    {
                        "start_time": "09:00:00",
                        "end_time": "09:30:00",
                        "is_available": True,
                        "price": 750.00
                    }
                ]
            }
        }