# backend/app/core/config.py

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """
    Application settings and configuration.
    Reads from .env file automatically.
    """
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # App Info
    APP_NAME: str = "Studio Booking API"
    VERSION: str = "1.0.0"
    
    class Config:
        env_file = ".env"

# Create settings instance
settings = Settings()