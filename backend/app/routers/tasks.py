"""
Task CRUD endpoints.
All endpoints require valid JWT authentication and enforce user-scoped data access.

Phase II: Enhanced with auth event logging for access control violations.
"""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth import get_current_user, verify_user_access
from app.database import get_session
from app.models import Task
from app.schemas import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse

router = APIRouter(prefix="/api/{user_id}/tasks", tags=["tasks"])


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    user_id: str,
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> TaskListResponse:
    """
    List all tasks for the authenticated user.

    - **user_id**: UUID of the user (must match authenticated user)

    Returns list of tasks owned by the user.
    """
    # Verify user has access to this resource (logs denial if mismatch)
    verify_user_access(current_user_id, user_id, request, f"GET /api/{user_id}/tasks")

    # Query tasks for this user
    statement = select(Task).where(Task.user_id == user_id)
    result = await session.execute(statement)
    tasks = result.scalars().all()

    return TaskListResponse(
        tasks=[TaskResponse.model_validate(task) for task in tasks],
        count=len(tasks)
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> TaskResponse:
    """
    Create a new task for the authenticated user.

    - **user_id**: UUID of the user (must match authenticated user)
    - **task_data**: Task creation data (title)

    Returns the created task.
    """
    # Verify user has access to this resource (logs denial if mismatch)
    verify_user_access(current_user_id, user_id, request, f"POST /api/{user_id}/tasks")

    # Create new task
    task = Task(
        user_id=user_id,
        title=task_data.title,
        is_completed=False,
    )

    session.add(task)
    await session.commit()
    await session.refresh(task)

    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    user_id: str,
    task_id: UUID,
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> TaskResponse:
    """
    Get a specific task by ID.

    - **user_id**: UUID of the user (must match authenticated user)
    - **task_id**: UUID of the task

    Returns the task if found and owned by user.
    """
    # Verify user has access to this resource (logs denial if mismatch)
    verify_user_access(current_user_id, user_id, request, f"GET /api/{user_id}/tasks/{task_id}")

    # Get task
    task = await session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this task"
        )

    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    user_id: str,
    task_id: UUID,
    task_data: TaskUpdate,
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> TaskResponse:
    """
    Update an existing task.

    - **user_id**: UUID of the user (must match authenticated user)
    - **task_id**: UUID of the task to update
    - **task_data**: Fields to update

    Returns the updated task.
    """
    # Verify user has access to this resource (logs denial if mismatch)
    verify_user_access(current_user_id, user_id, request, f"PUT /api/{user_id}/tasks/{task_id}")

    # Get task
    task = await session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this task"
        )

    # Update fields if provided
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.is_completed is not None:
        task.is_completed = task_data.is_completed

    task.updated_at = datetime.utcnow()

    session.add(task)
    await session.commit()
    await session.refresh(task)

    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    user_id: str,
    task_id: UUID,
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> None:
    """
    Delete a task.

    - **user_id**: UUID of the user (must match authenticated user)
    - **task_id**: UUID of the task to delete

    Returns 204 No Content on success.
    """
    # Verify user has access to this resource (logs denial if mismatch)
    verify_user_access(current_user_id, user_id, request, f"DELETE /api/{user_id}/tasks/{task_id}")

    # Get task
    task = await session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this task"
        )

    await session.delete(task)
    await session.commit()


@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_complete(
    user_id: str,
    task_id: UUID,
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    request: Request,
) -> TaskResponse:
    """
    Toggle task completion status.

    - **user_id**: UUID of the user (must match authenticated user)
    - **task_id**: UUID of the task to toggle

    If task is incomplete, marks it as complete.
    If task is complete, marks it as incomplete.

    Returns the updated task.
    """
    # Verify user has access to this resource (logs denial if mismatch)
    verify_user_access(current_user_id, user_id, request, f"PATCH /api/{user_id}/tasks/{task_id}/complete")

    # Get task
    task = await session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this task"
        )

    # Toggle completion status
    task.is_completed = not task.is_completed
    task.updated_at = datetime.utcnow()

    session.add(task)
    await session.commit()
    await session.refresh(task)

    return TaskResponse.model_validate(task)
