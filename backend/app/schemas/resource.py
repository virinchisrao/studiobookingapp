# backend/app/schemas/resource.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal

# ============================================
# RESOURCE CREATE SCHEMA
# ============================================
class ResourceCreate(BaseModel):
    """
    Schema for creating a new resource (room) in a studio.
    """
    name: str = Field(..., min_length=2, max_length=255)
    resource_type: Optional[str] = Field(None, pattern="^(live_room|control_room|booth|rehearsal)$")
    description: Optional[str] = None
    base_price_per_hour: Decimal = Field(..., gt=0, decimal_places=2)
    max_occupancy: Optional[int] = Field(None, gt=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Live Room A",
                "resource_type": "live_room",
                "description": "Large live room with drum kit and amps",
                "base_price_per_hour": 1500.00,
                "max_occupancy": 10
            }
        }


# ============================================
# RESOURCE UPDATE SCHEMA
# ============================================
class ResourceUpdate(BaseModel):
    """
    Schema for updating resource information.
    All fields are optional.
    """
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    resource_type: Optional[str] = Field(None, pattern="^(live_room|control_room|booth|rehearsal)$")
    description: Optional[str] = None
    base_price_per_hour: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    max_occupancy: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Live Room A - Updated",
                "base_price_per_hour": 1800.00
            }
        }


# ============================================
# RESOURCE RESPONSE SCHEMA
# ============================================
class ResourceResponse(BaseModel):
    """
    Schema for resource data in API responses.
    """
    resource_id: int
    studio_id: int
    name: str
    resource_type: Optional[str]
    description: Optional[str]
    base_price_per_hour: Decimal
    max_occupancy: Optional[int]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "resource_id": 1,
                "studio_id": 1,
                "name": "Live Room A",
                "resource_type": "live_room",
                "description": "Large live room",
                "base_price_per_hour": 1500.00,
                "max_occupancy": 10,
                "is_active": True,
                "created_at": "2024-01-15T10:30:00"
            }
        }