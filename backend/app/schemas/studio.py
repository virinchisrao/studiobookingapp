# backend/app/schemas/studio.py

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from decimal import Decimal

# ============================================
# STUDIO CREATE SCHEMA
# ============================================
class StudioCreate(BaseModel):
    """
    Schema for creating a new studio.
    """
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    address: str = Field(..., min_length=5)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    lat: Decimal = Field(..., ge=-90, le=90, description="Latitude is required") 
    lng: Decimal = Field(..., ge=-180, le=180, description="Longitude is required") 
    phone: Optional[str] = Field(None, max_length=20)
    
    @field_validator('lat', 'lng')
    def validate_coordinates(cls, v):
        if v is None:
            raise ValueError('Location coordinates are required')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Sound Studio Mumbai",
                "description": "Professional recording studio",
                "address": "123 Music Street, Bandra West",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postal_code": "400050",
                "lat": 19.0760,
                "lng": 72.8777,
                "phone": "+912212345678"
            }
        }


# ============================================
# STUDIO UPDATE SCHEMA
# ============================================
class StudioUpdate(BaseModel):
    """
    Schema for updating studio information.
    """
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = Field(None, min_length=5)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    lat: Optional[Decimal] = None 
    lng: Optional[Decimal] = None  
    phone: Optional[str] = Field(None, max_length=20)
    is_published: Optional[bool] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Sound Studio Mumbai - Updated",
                "lat": 19.0760,
                "lng": 72.8777,
                "is_published": True
            }
        }


# ============================================
# STUDIO RESPONSE SCHEMA
# ============================================
class StudioResponse(BaseModel):
    """
    Schema for studio data in API responses.
    """
    studio_id: int
    owner_id: int
    name: str
    description: Optional[str]
    address: str
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    lat: Optional[Decimal]  
    lng: Optional[Decimal] 
    phone: Optional[str]
    is_active: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "studio_id": 1,
                "owner_id": 2,
                "name": "Sound Studio Mumbai",
                "description": "Professional recording studio",
                "address": "123 Music Street, Bandra West",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postal_code": "400050",
                "lat": 19.0760,
                "lng": 72.8777,
                "phone": "+912212345678",
                "is_active": True,
                "is_published": True,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }