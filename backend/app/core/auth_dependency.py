# backend/app/core/auth_dependency.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# Security scheme for Swagger UI (shows lock icon)
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current logged-in user from JWT token.
    
    How it works:
    1. Extract token from Authorization header
    2. Decode and verify token
    3. Get user from database
    4. Return user object
    
    Usage in routes:
        @app.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"message": f"Hello {current_user.name}"}
    """
    
    # Get token from Authorization header
    token = credentials.credentials
    
    # Decode token
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user_id from token payload
    user_id = payload.get("user_id")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Check if user is flagged
    if user.is_flagged:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is flagged"
        )
    
    return user


def get_current_active_customer(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure current user is a CUSTOMER.
    Use this for customer-only routes (like booking).
    """
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access this resource"
        )
    return current_user


def get_current_active_owner(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure current user is a STUDIO OWNER.
    Use this for owner-only routes (like managing studios).
    """
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only studio owners can access this resource"
        )
    return current_user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure current user is an ADMIN.
    Use this for admin-only routes.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this resource"
        )
    return current_user