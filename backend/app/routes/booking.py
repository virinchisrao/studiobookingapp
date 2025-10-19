# backend/app/routes/booking.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, time, timedelta  # Add timedelta here
from app.core.database import get_db
from app.core.auth_dependency import get_current_user, get_current_active_customer, get_current_active_owner
from app.schemas.booking import (
    BookingCreate, 
    BookingResponse, 
    BookingApproval, 
    BookingCancellation,
    TimeSlot,
    AvailableSlotsResponse
)
from app.models.user import User
from app.models.studio import Studio
from app.models.resource import Resource
from app.models.booking import Booking, BookingStatus
from app.utils.booking_helpers import (
    calculate_duration_minutes,
    calculate_booking_price,
    check_time_slot_available,
    calculate_refund_amount
)

# Create router
router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


# ============================================
# GET AVAILABLE TIME SLOTS (Public/Customer)
# ============================================
@router.get("/available-slots/{resource_id}", response_model=List[TimeSlot])
def get_available_slots(
    resource_id: int,
    booking_date: date,
    db: Session = Depends(get_db)
):
    """
    Get all available 30-minute time slots for a resource on a specific date.
    
    This endpoint:
    1. Gets the resource details
    2. Generates 30-min slots (e.g., 9:00-9:30, 9:30-10:00, etc.)
    3. Checks which slots are already booked
    4. Returns list of slots with availability status
    
    For MVP Phase 1: We'll use simple 9 AM - 10 PM availability.
    Phase 2 will use availability_template table.
    """
    
    # Check if resource exists
    resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found"
        )
    
    if not resource.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This resource is not currently available for booking"
        )
    
    # For Phase 1: Simple availability (9 AM - 10 PM)
    # Phase 2: Query availability_template table
    open_time = time(9, 0)   # 9:00 AM
    close_time = time(22, 0)  # 10:00 PM
    
    # Generate all 30-minute slots
    slots = []
    current_time = datetime.combine(date.today(), open_time)
    end_time = datetime.combine(date.today(), close_time)
    
    while current_time < end_time:
        slot_start = current_time.time()
        current_time += timedelta(minutes=30)
        slot_end = current_time.time()
        
        if current_time <= end_time:
            # Check if this slot is available
            is_available = check_time_slot_available(
                db=db,
                resource_id=resource_id,
                booking_date=booking_date,
                start_time=slot_start,
                end_time=slot_end
            )
            
            # Calculate price for this 30-min slot
            price = calculate_booking_price(resource.base_price_per_hour, 30)
            
            slots.append(TimeSlot(
                start_time=slot_start,
                end_time=slot_end,
                is_available=is_available,
                price=price
            ))
    
    return slots


# ============================================
# CREATE BOOKING (Customer Only)
# ============================================
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_customer)
):
    """
    Create a new booking request.
    
    Steps:
    1. Validate resource exists and is active
    2. Check time slot is available
    3. Calculate duration and price
    4. Create booking with status 'pending_approval'
    5. Owner will need to approve it
    """
    
    # Step 1: Get resource and validate
    resource = db.query(Resource).filter(
        Resource.resource_id == booking_data.resource_id
    ).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {booking_data.resource_id} not found"
        )
    
    if not resource.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This resource is not available for booking"
        )
    
    # Get studio (for studio_id)
    studio = db.query(Studio).filter(Studio.studio_id == resource.studio_id).first()
    
    if not studio.is_published or not studio.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This studio is not currently accepting bookings"
        )
    
    # Step 2: Check if time slot is available
    is_available = check_time_slot_available(
        db=db,
        resource_id=booking_data.resource_id,
        booking_date=booking_data.booking_date,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time
    )
    
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is already booked. Please choose a different time."
        )
    
    # Step 3: Calculate duration and price
    duration = calculate_duration_minutes(booking_data.start_time, booking_data.end_time)
    
    # Validate minimum duration (30 minutes)
    if duration < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum booking duration is 30 minutes"
        )
    
    # Validate duration is in 30-minute increments
    if duration % 30 != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking duration must be in 30-minute increments"
        )
    
    total_amount = calculate_booking_price(resource.base_price_per_hour, duration)
    
    # Step 4: Create booking
    new_booking = Booking(
        user_id=current_user.user_id,
        resource_id=booking_data.resource_id,
        studio_id=resource.studio_id,
        booking_date=booking_data.booking_date,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        duration_minutes=duration,
        status=BookingStatus.PENDING_APPROVAL,
        total_amount=total_amount,
        currency="INR"
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return new_booking


# ============================================
# GET MY BOOKINGS (Customer)
# ============================================
@router.get("/my-bookings", response_model=List[BookingResponse])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_customer)
):
    """
    Get all bookings for the current customer.
    Sorted by booking date (newest first).
    """
    
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.user_id
    ).order_by(Booking.created_at.desc()).all()
    
    return bookings


# ============================================
# GET PENDING BOOKINGS FOR MY STUDIOS (Owner)
# ============================================
@router.get("/pending-approvals", response_model=List[BookingResponse])
def get_pending_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Get all pending booking requests for studios owned by current user.
    Owner needs to approve or reject these.
    """
    
    # Get all studio IDs owned by this user
    studio_ids = db.query(Studio.studio_id).filter(
        Studio.owner_id == current_user.user_id
    ).all()
    studio_ids = [s[0] for s in studio_ids]  # Extract IDs from tuples
    
    if not studio_ids:
        return []  # Owner has no studios
    
    # Get pending bookings for these studios
    bookings = db.query(Booking).filter(
        Booking.studio_id.in_(studio_ids),
        Booking.status == BookingStatus.PENDING_APPROVAL
    ).order_by(Booking.created_at.asc()).all()
    
    return bookings


# ============================================
# GET ALL BOOKINGS FOR MY STUDIOS (Owner)
# ============================================
@router.get("/my-studio-bookings", response_model=List[BookingResponse])
def get_my_studio_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Get all bookings (all statuses) for studios owned by current user.
    """
    
    # Get all studio IDs owned by this user
    studio_ids = db.query(Studio.studio_id).filter(
        Studio.owner_id == current_user.user_id
    ).all()
    studio_ids = [s[0] for s in studio_ids]
    
    if not studio_ids:
        return []
    
    # Get all bookings for these studios
    bookings = db.query(Booking).filter(
        Booking.studio_id.in_(studio_ids)
    ).order_by(Booking.booking_date.desc(), Booking.start_time.desc()).all()
    
    return bookings


# ============================================
# APPROVE OR REJECT BOOKING (Owner)
# ============================================
@router.put("/{booking_id}/approve", response_model=BookingResponse)
def approve_or_reject_booking(
    booking_id: int,
    approval_data: BookingApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Approve or reject a booking request.
    Only the studio owner can approve/reject bookings.
    """
    
    # Get booking
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found"
        )
    
    # Check if current user owns the studio
    studio = db.query(Studio).filter(Studio.studio_id == booking.studio_id).first()
    
    if studio.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to approve this booking"
        )
    
    # Check if booking is in pending status
    if booking.status != BookingStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking is already {booking.status}. Can only approve/reject pending bookings."
        )
    
    # Approve or Reject
    if approval_data.approve:
        # APPROVE
        booking.status = BookingStatus.APPROVED
        booking.approved_at = datetime.utcnow()
        booking.approved_by = current_user.user_id
        booking.rejection_reason = None
    else:
        # REJECT
        booking.status = BookingStatus.REJECTED
        booking.rejection_reason = approval_data.rejection_reason
        booking.approved_at = None
        booking.approved_by = None
    
    db.commit()
    db.refresh(booking)
    
    return booking


# ============================================
# CANCEL BOOKING (Customer)
# ============================================
@router.put("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    cancellation_data: BookingCancellation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a booking.
    Customer can cancel their own booking.
    
    Cancellation policy:
    - >24 hours before: 80% refund
    - <24 hours before: 0% refund
    """
    
    # Get booking
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found"
        )
    
    # Check if current user owns this booking
    if booking.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings"
        )
    
    # Check if booking can be cancelled
    if booking.status in [BookingStatus.CANCELLED, BookingStatus.REFUNDED, BookingStatus.COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a booking with status: {booking.status}"
        )
    
    # Calculate refund
    refund_percentage, refund_amount = calculate_refund_amount(
        total_amount=booking.total_amount,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        cancellation_date=datetime.utcnow()
    )
    
    # Update booking
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.utcnow()
    booking.cancel_reason = cancellation_data.cancel_reason
    booking.refund_percentage = refund_percentage
    booking.refund_amount = refund_amount
    
    db.commit()
    db.refresh(booking)
    
    return booking


# ============================================
# GET SINGLE BOOKING DETAILS
# ============================================
@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific booking.
    User can only see their own bookings (or owner can see bookings for their studios).
    """
    
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found"
        )
    
    # Check permissions
    is_customer = booking.user_id == current_user.user_id
    
    # Check if user is the studio owner
    is_owner = False
    if current_user.role == "owner":
        studio = db.query(Studio).filter(Studio.studio_id == booking.studio_id).first()
        is_owner = studio.owner_id == current_user.user_id
    
    # Check if user is admin
    is_admin = current_user.role == "admin"
    
    if not (is_customer or is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this booking"
        )
    
    return booking