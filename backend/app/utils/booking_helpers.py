# backend/app/utils/booking_helpers.py

from datetime import datetime, date, time, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingStatus
from typing import List, Tuple


def calculate_duration_minutes(start_time: time, end_time: time) -> int:
    """
    Calculate duration in minutes between two times.
    
    Args:
        start_time: Start time
        end_time: End time
        
    Returns:
        Duration in minutes
    """
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)
    duration = end_dt - start_dt
    return int(duration.total_seconds() / 60)


def calculate_booking_price(base_price_per_hour: Decimal, duration_minutes: int) -> Decimal:
    """
    Calculate total price for a booking.
    
    Args:
        base_price_per_hour: Base price per hour from resource
        duration_minutes: Duration of booking in minutes
        
    Returns:
        Total price
    """
    hours = Decimal(duration_minutes) / Decimal(60)
    total = base_price_per_hour * hours
    return round(total, 2)


def check_time_slot_available(
    db: Session,
    resource_id: int,
    booking_date: date,
    start_time: time,
    end_time: time,
    exclude_booking_id: int = None
) -> bool:
    """
    Check if a time slot is available for booking.
    
    Args:
        db: Database session
        resource_id: Resource to check
        booking_date: Date of booking
        start_time: Start time
        end_time: End time
        exclude_booking_id: Booking ID to exclude (for updates)
        
    Returns:
        True if available, False if already booked
    """
    
    # Query for overlapping bookings
    query = db.query(Booking).filter(
        Booking.resource_id == resource_id,
        Booking.booking_date == booking_date,
        Booking.status.in_([
            BookingStatus.PENDING_APPROVAL,
            BookingStatus.APPROVED,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN
        ])
    )
    
    # Exclude specific booking if provided (for updates)
    if exclude_booking_id:
        query = query.filter(Booking.booking_id != exclude_booking_id)
    
    existing_bookings = query.all()
    
    # Check for time overlaps
    for booking in existing_bookings:
        # Convert times to datetime for comparison
        new_start = datetime.combine(booking_date, start_time)
        new_end = datetime.combine(booking_date, end_time)
        existing_start = datetime.combine(booking.booking_date, booking.start_time)
        existing_end = datetime.combine(booking.booking_date, booking.end_time)
        
        # Check if times overlap
        if (new_start < existing_end) and (new_end > existing_start):
            return False  # Time slot is already booked
    
    return True  # Time slot is available


def generate_time_slots(start_time: time, end_time: time, interval_minutes: int = 30) -> List[Tuple[time, time]]:
    """
    Generate 30-minute time slots between start and end time.
    
    Args:
        start_time: Opening time
        end_time: Closing time
        interval_minutes: Slot duration (default 30 minutes)
        
    Returns:
        List of (start_time, end_time) tuples
    """
    slots = []
    current = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)
    
    while current < end_dt:
        slot_start = current.time()
        current += timedelta(minutes=interval_minutes)
        slot_end = current.time()
        
        if current <= end_dt:
            slots.append((slot_start, slot_end))
    
    return slots


# TODO
# Later chnge the refund amount according to the cost 
def calculate_refund_amount(
    total_amount: Decimal,
    booking_date: date,
    start_time: time,
    cancellation_date: datetime
) -> Tuple[Decimal, Decimal]:
    """
    Calculate refund amount based on cancellation policy.
    
    Policy: Cancel >24 hours before = 80% refund
            Cancel <24 hours before = 0% refund
    
    Args:
        total_amount: Original booking amount
        booking_date: Date of booking
        start_time: Start time of booking
        cancellation_date: When user cancelled
        
    Returns:
        Tuple of (refund_percentage, refund_amount)
    """
    # Combine booking date and start time
    booking_datetime = datetime.combine(booking_date, start_time)
    
    # Calculate hours until booking
    hours_until_booking = (booking_datetime - cancellation_date).total_seconds() / 3600
    
    if hours_until_booking >= 24:
        # More than 24 hours before - 80% refund
        refund_percentage = Decimal('80.00')
    else:
        # Less than 24 hours - no refund
        refund_percentage = Decimal('0.00')
    
    refund_amount = (total_amount * refund_percentage) / Decimal('100.00')
    return (refund_percentage, round(refund_amount, 2))