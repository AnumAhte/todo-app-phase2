from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (minimum 8 characters)")
    name: str = Field(..., min_length=1, max_length=255, description="User display name")


class UserResponse(BaseModel):
    """Schema for user response data."""

    id: UUID = Field(..., description="Unique user identifier")
    email: str = Field(..., description="User email address")
    name: str = Field(..., description="User display name")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = {"from_attributes": True}
