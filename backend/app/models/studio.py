# backend/app/models/studio.py

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey,DECIMAL
from sqlalchemy.sql import func
from app.core.database import Base

class Studio(Base):
    """
    Studio model - represents the 'studios' table.
    """
    
    __tablename__ = "studios"
    
    studio_id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)

    lat = Column(DECIMAL(10, 8), nullable=True)
    lng = Column(DECIMAL(11, 8), nullable=True)
    
    phone = Column(String(20), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Studio {self.name} (ID: {self.studio_id})>"