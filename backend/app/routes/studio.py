# backend/app/routes/studio.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth_dependency import get_current_user, get_current_active_owner
from app.schemas.studio import StudioCreate, StudioUpdate, StudioResponse
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.models.user import User
from app.models.studio import Studio
from app.models.resource import Resource

# Create router
router = APIRouter(
    prefix="/studios",
    tags=["Studios"]
)


# ============================================
# CREATE STUDIO (Owner Only)
# ============================================
@router.post("/", response_model=StudioResponse, status_code=status.HTTP_201_CREATED)
def create_studio(
    studio_data: StudioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Create a new studio.
    Only users with role='owner' can create studios.
    
    The studio will be in draft mode (is_published=False) by default.
    Owner can publish it later when ready.
    """
    
    # Create new studio
    new_studio = Studio(
        owner_id=current_user.user_id,
        name=studio_data.name,
        description=studio_data.description,
        address=studio_data.address,
        city=studio_data.city,
        state=studio_data.state,
        postal_code=studio_data.postal_code,
        phone=studio_data.phone,
        is_active=True,
        is_published=False  # Draft by default
    )
    
    db.add(new_studio)
    db.commit()
    db.refresh(new_studio)
    
    return new_studio


# ============================================
# GET MY STUDIOS (Owner Only)
# ============================================
@router.get("/my-studios", response_model=List[StudioResponse])
def get_my_studios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Get all studios owned by the current user.
    Only for studio owners.
    """
    
    studios = db.query(Studio).filter(Studio.owner_id == current_user.user_id).all()
    return studios


# ============================================
# GET ALL STUDIOS (Public - for customers)
# ============================================
@router.get("/", response_model=List[StudioResponse])
def get_all_studios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all published and active studios.
    Public endpoint - anyone can access.
    Used by customers to browse available studios.
    """
    
    studios = db.query(Studio).filter(
        Studio.is_active == True,
        Studio.is_published == True
    ).offset(skip).limit(limit).all()
    
    return studios


# ============================================
# GET SINGLE STUDIO BY ID
# ============================================
@router.get("/{studio_id}", response_model=StudioResponse)
def get_studio(
    studio_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single studio by ID.
    Public endpoint.
    """
    
    studio = db.query(Studio).filter(Studio.studio_id == studio_id).first()
    
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Studio with ID {studio_id} not found"
        )
    
    # Only show published studios to public (unless owner is viewing their own)
    if not studio.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    return studio


# ============================================
# UPDATE STUDIO (Owner Only)
# ============================================
@router.put("/{studio_id}", response_model=StudioResponse)
def update_studio(
    studio_id: int,
    studio_data: StudioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Update studio information.
    Only the owner of the studio can update it.
    """
    
    # Get studio
    studio = db.query(Studio).filter(Studio.studio_id == studio_id).first()
    
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Studio with ID {studio_id} not found"
        )
    
    # Check if current user is the owner
    if studio.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this studio"
        )
    
    # Update fields (only if provided)
    update_data = studio_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(studio, field, value)
    
    db.commit()
    db.refresh(studio)
    
    return studio


# ============================================
# DELETE STUDIO (Owner Only)
# ============================================
@router.delete("/{studio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_studio(
    studio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Delete a studio.
    Only the owner can delete their studio.
    This will also delete all resources and bookings (CASCADE).
    """
    
    # Get studio
    studio = db.query(Studio).filter(Studio.studio_id == studio_id).first()
    
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Studio with ID {studio_id} not found"
        )
    
    # Check if current user is the owner
    if studio.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this studio"
        )
    
    db.delete(studio)
    db.commit()
    
    return None