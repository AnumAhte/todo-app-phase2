from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional


class Task(SQLModel, table=True):
    """
    Task entity representing a todo item belonging to a user.

    Constraints:
    - title: 1-500 characters, required
    - user_id: Better Auth user ID (string format)

    Note: user_id references Better Auth's user table (string IDs),
    not the backend's users table (UUID).
    """

    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(max_length=32, index=True, nullable=False)  # Better Auth string ID
    title: str = Field(max_length=500, nullable=False)
    is_completed: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
