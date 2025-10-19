# backend/app/models/resource.py

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, DECIMAL, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ResourceType(str, enum.Enum):
    """Enum for resource types"""
    LIVE_ROOM = "live_room"
    CONTROL_ROOM = "control_room"
    BOOTH = "booth"
    REHEARSAL = "rehearsal"


class Resource(Base):
    """
    Resource model - represents bookable rooms/spaces within a studio.
    """
    
    __tablename__ = "resources"
    
    resource_id = Column(Integer, primary_key=True, index=True)
    studio_id = Column(Integer, ForeignKey("studios.studio_id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    resource_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    base_price_per_hour = Column(DECIMAL(10, 2), nullable=False)
    max_occupancy = Column(Integer, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Resource {self.name} (Studio ID: {self.studio_id})>"