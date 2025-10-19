# backend/app/models/__init__.py

from app.models.user import User
from app.models.studio import Studio
from app.models.resource import Resource, ResourceType
from app.models.availability import AvailabilityTemplate, AvailabilityException
from app.models.booking import Booking, BookingStatus
from app.models.event_log import EventLog

# This makes imports easier elsewhere:
# from app.models import User, Studio, Resource, Booking, etc.