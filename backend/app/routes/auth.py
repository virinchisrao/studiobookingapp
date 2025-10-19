# backend/app/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.schemas.user import UserRegister, UserResponse
from app.models.user import User
from datetime import timedelta
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.user import UserRegister, UserResponse, UserLogin, Token
from app.core.config import settings
from app.core.auth_dependency import get_current_user

# Create router
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================
# REGISTER ENDPOINT
# ============================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user (customer or studio owner).
    """
    
    try:
        # Step 1: Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered. Please use a different email or login."
            )
        
        # Step 2: Hash the password
        print(f"Hashing password for user: {user_data.email}")
        hashed_password = hash_password(user_data.password)
        print(f"Password hashed successfully")
        
        # Step 3: Create new user object
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            name=user_data.name,
            phone=user_data.phone,
            role=user_data.role,
            is_active=True,
            is_flagged=False,
            email_verified=False
        )
        
        # Add to database
        print(f"Adding user to database: {user_data.email}")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"User created successfully with ID: {new_user.user_id}")
        
        # Step 4: Return user data
        return new_user
        
    except HTTPException:
        # Re-raise HTTP exceptions (like duplicate email)
        raise
    except Exception as e:
        # Catch any other errors
        print(f"ERROR in registration: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


# ============================================
# TEST: Get all users (for debugging)
# ============================================
@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """
    Get all users (for testing only - we'll remove this later or make it admin-only).
    """
    users = db.query(User).all()
    return users


# ============================================
# LOGIN ENDPOINT
# ============================================
@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and return JWT access token.
    
    Steps:
    1. Find user by email
    2. Verify password
    3. Create JWT token
    4. Return token + user data
    """
    
    # Step 1: Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Step 2: Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support."
        )
    
    # Check if user is flagged
    if user.is_flagged:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is flagged. Please contact support."
        )
    
    # Step 3: Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role
        },
        expires_delta=access_token_expires
    )
    
    # Step 4: Update last login time
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Step 5: Return token and user data
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# ============================================
# GET CURRENT USER (Protected Route)
# ============================================
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user's information.
    This is a PROTECTED route - requires valid JWT token.
    
    To test in Swagger:
    1. Login first to get token
    2. Click "Authorize" button (lock icon) at top
    3. Enter: Bearer YOUR_TOKEN_HERE
    4. Then try this endpoint
    """
    return current_user