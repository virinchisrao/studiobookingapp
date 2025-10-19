# backend/app/routes/resource.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth_dependency import get_current_user, get_current_active_owner
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.models.user import User
from app.models.studio import Studio
from app.models.resource import Resource

# Create router
router = APIRouter(
    prefix="/resources",
    tags=["Resources"]
)


# ============================================
# ADD RESOURCE TO STUDIO (Owner Only)
# ============================================
@router.post("/{studio_id}/resources", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def add_resource_to_studio(
    studio_id: int,
    resource_data: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Add a resource (room/space) to a studio.
    Only the studio owner can add resources.
    """
    
    # Check if studio exists
    studio = db.query(Studio).filter(Studio.studio_id == studio_id).first()
    
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Studio with ID {studio_id} not found"
        )
    
    # Check if current user owns the studio
    if studio.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add resources to this studio"
        )
    
    # Create new resource
    new_resource = Resource(
        studio_id=studio_id,
        name=resource_data.name,
        resource_type=resource_data.resource_type,
        description=resource_data.description,
        base_price_per_hour=resource_data.base_price_per_hour,
        max_occupancy=resource_data.max_occupancy,
        is_active=True
    )
    
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    
    return new_resource


# ============================================
# GET RESOURCES FOR A STUDIO
# ============================================
@router.get("/{studio_id}/resources", response_model=List[ResourceResponse])
def get_studio_resources(
    studio_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all resources (rooms) for a specific studio.
    Public endpoint.
    """
    
    # Check if studio exists
    studio = db.query(Studio).filter(Studio.studio_id == studio_id).first()
    
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Studio with ID {studio_id} not found"
        )
    
    # Get all active resources for this studio
    resources = db.query(Resource).filter(
        Resource.studio_id == studio_id,
        Resource.is_active == True
    ).all()
    
    return resources


# ============================================
# GET SINGLE RESOURCE
# ============================================
@router.get("/resource/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a single resource by ID.
    Public endpoint.
    """
    
    resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found"
        )
    
    return resource


# ============================================
# UPDATE RESOURCE (Owner Only)
# ============================================
@router.put("/resource/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    resource_data: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Update resource information.
    Only the studio owner can update resources.
    """
    
    # Get resource
    resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found"
        )
    
    # Get studio to check ownership
    studio = db.query(Studio).filter(Studio.studio_id == resource.studio_id).first()
    
    if studio.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this resource"
        )
    
    # Update fields
    update_data = resource_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)
    
    db.commit()
    db.refresh(resource)
    
    return resource


# ============================================
# DELETE RESOURCE (Owner Only)
# ============================================
@router.delete("/resource/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_owner)
):
    """
    Delete a resource.
    Only the studio owner can delete resources.
    """
    
    # Get resource
    resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found"
        )
    
    # Get studio to check ownership
    studio = db.query(Studio).filter(Studio.studio_id == resource.studio_id).first()
    
    if studio.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this resource"
        )
    
    db.delete(resource)
    db.commit()
    
    return None