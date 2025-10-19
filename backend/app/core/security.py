# backend/app/core/security.py

from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.core.config import settings

# Password hashing context - using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================
# PASSWORD FUNCTIONS
# ============================================

def hash_password(password: str) -> str:
    """
    Hash a plain text password.
    
    Args:
        password: Plain text password from user
        
    Returns:
        Hashed password string
    """
    try:
        # Convert password to bytes and check length
        password_bytes = password.encode('utf-8')
        
        # Bcrypt has a 72 byte limit
        if len(password_bytes) > 72:
            # Truncate to 72 bytes
            password = password_bytes[:72].decode('utf-8', errors='ignore')
        
        # Hash the password
        hashed = pwd_context.hash(password)
        return hashed
        
    except Exception as e:
        print(f"Error hashing password: {e}")
        raise ValueError(f"Failed to hash password: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    
    Args:
        plain_password: Password user entered during login
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        # Convert to bytes and truncate if needed (same as hash_password)
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            plain_password = password_bytes[:72].decode('utf-8', errors='ignore')
        
        return pwd_context.verify(plain_password, hashed_password)
        
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False


# ============================================
# JWT TOKEN FUNCTIONS
# ============================================

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary of data to encode in token (usually user_id and email)
        expires_delta: How long until token expires
        
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Create token
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def decode_access_token(token: str):
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Payload dictionary if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None