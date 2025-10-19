# backend/app/schemas/__init__.py

from app.schemas.user import UserRegister, UserResponse, UserLogin, Token
from app.schemas.studio import StudioCreate, StudioUpdate, StudioResponse
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.schemas.booking import (
    BookingCreate, 
    BookingResponse, 
    BookingApproval, 
    BookingCancellation,
    TimeSlot,
    AvailableSlotsResponse
)