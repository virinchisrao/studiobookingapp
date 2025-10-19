# backend/app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# ============================================
# USER REGISTRATION SCHEMA
# ============================================
class UserRegister(BaseModel):
    """
    Schema for user registration.
    This defines what data the user must send to register.
    """
    email: EmailStr  # Validates email format automatically
    password: str = Field(..., min_length=6, max_length=72)
    name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: str = Field(..., pattern="^(customer|owner)$")  # Only customer or owner allowed
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "securepass123",
                "name": "John Doe",
                "phone": "+919876543210",
                "role": "customer"
            }
        }


# ============================================
# USER RESPONSE SCHEMA
# ============================================
class UserResponse(BaseModel):
    """
    Schema for user data in API responses.
    We DON'T send password_hash to the client!
    """
    user_id: int
    email: str
    name: str
    phone: Optional[str]
    role: str
    is_active: bool
    is_flagged: bool
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy model
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "email": "john@example.com",
                "name": "John Doe",
                "phone": "+919876543210",
                "role": "customer",
                "is_active": True,
                "is_flagged": False,
                "email_verified": False,
                "created_at": "2024-01-15T10:30:00",
                "last_login": None
            }
        }


# ============================================
# USER LOGIN SCHEMA
# ============================================
class UserLogin(BaseModel):
    """
    Schema for user login.
    """
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "securepass123"
            }
        }


# ============================================
# TOKEN RESPONSE SCHEMA
# ============================================
class Token(BaseModel):
    """
    Schema for JWT token response after login.
    """
    access_token: str
    token_type: str
    user: UserResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "user_id": 1,
                    "email": "john@example.com",
                    "name": "John Doe",
                    "role": "customer"
                }
            }
        }