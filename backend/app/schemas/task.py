from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import List, Optional


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Task description text",
        examples=["Complete project documentation"]
    )


class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""

    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=500,
        description="Updated task description",
        examples=["Updated task title"]
    )
    is_completed: Optional[bool] = Field(
        None,
        description="Task completion status"
    )


class TaskResponse(BaseModel):
    """Schema for task response data."""

    id: UUID = Field(..., description="Unique task identifier")
    user_id: str = Field(..., description="Owner of the task (Better Auth user ID)")
    title: str = Field(..., description="Task description text")
    is_completed: bool = Field(..., description="Completion status")
    created_at: datetime = Field(..., description="Task creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Schema for paginated task list response."""

    tasks: List[TaskResponse] = Field(..., description="List of tasks")
    count: int = Field(..., description="Total number of tasks returned")
