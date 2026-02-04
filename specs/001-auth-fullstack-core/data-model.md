# Data Model: Authenticated Full-Stack Core (Phase I)

**Feature Branch**: `001-auth-fullstack-core`
**Date**: 2026-01-15
**Source**: [spec.md](./spec.md) Key Entities section

## Overview

This document defines the data model for the multi-user Todo application. The model consists of two primary entities: **User** and **Task**, with a one-to-many relationship between them.

---

## Entity Relationship Diagram

```
┌─────────────────────┐         ┌─────────────────────────┐
│       User          │         │         Task            │
├─────────────────────┤         ├─────────────────────────┤
│ id (PK, UUID)       │────────<│ id (PK, UUID)           │
│ email (unique)      │         │ user_id (FK, UUID)      │
│ name               │         │ title (string)          │
│ created_at          │         │ is_completed (bool)     │
│ updated_at          │         │ created_at              │
│                     │         │ updated_at              │
└─────────────────────┘         └─────────────────────────┘
        │                                │
        │  One User has Many Tasks       │
        └────────────────────────────────┘
```

---

## Entity: User

Represents a registered user of the system.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Unique identifier for the user |
| `email` | String(255) | Unique, Not Null, Indexed | User's email address (login identifier) |
| `name` | String(255) | Not Null | User's display name |
| `created_at` | DateTime | Not Null, Default: NOW | Account creation timestamp |
| `updated_at` | DateTime | Not Null, Default: NOW | Last update timestamp |

### Notes

- User authentication is managed by Better Auth
- Better Auth stores password hashes and session data in its own tables
- The `id` field must match Better Auth's user ID for JWT verification
- Email is the unique business identifier; Better Auth uses it for login

### SQLModel Definition (Backend)

```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID, uuid4

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    name: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### TypeScript Interface (Frontend)

```typescript
interface User {
  id: string;          // UUID as string
  email: string;
  name: string;
  createdAt: string;   // ISO 8601 datetime
  updatedAt: string;   // ISO 8601 datetime
}
```

---

## Entity: Task

Represents a todo item belonging to a user.

### Attributes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Unique identifier for the task |
| `user_id` | UUID | Foreign Key → User.id, Not Null, Indexed | Owner of the task |
| `title` | String(500) | Not Null | Task description text |
| `is_completed` | Boolean | Not Null, Default: false | Completion status |
| `created_at` | DateTime | Not Null, Default: NOW | Task creation timestamp |
| `updated_at` | DateTime | Not Null, Default: NOW | Last update timestamp |

### Validation Rules

| Rule | Constraint | Error Message |
|------|------------|---------------|
| Title required | `title` cannot be empty string | "Title is required" |
| Title length | `title` max 500 characters | "Title must be 500 characters or less" |
| User exists | `user_id` must reference existing User | "User not found" |

### State Transitions

```
                 ┌─────────────────────────────┐
                 │                             │
                 ▼                             │
    ┌───────────────────┐    toggle    ┌──────┴────────────┐
    │   is_completed    │◄────────────►│   is_completed    │
    │      = false      │              │      = true       │
    └───────────────────┘              └───────────────────┘
           │                                    │
           │                                    │
           └────────────────┬───────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   deleted   │
                     └─────────────┘
```

### SQLModel Definition (Backend)

```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=500)
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship (optional, for eager loading)
    user: Optional["User"] = Relationship(back_populates="tasks")
```

### TypeScript Interface (Frontend)

```typescript
interface Task {
  id: string;           // UUID as string
  userId: string;       // UUID as string (camelCase for JS)
  title: string;
  isCompleted: boolean;
  createdAt: string;    // ISO 8601 datetime
  updatedAt: string;    // ISO 8601 datetime
}

// For creating a new task
interface TaskCreate {
  title: string;
}

// For updating a task
interface TaskUpdate {
  title?: string;
  isCompleted?: boolean;
}
```

---

## Database Schema (PostgreSQL)

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Tasks Table

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, is_completed);
```

---

## Pydantic Schemas (API Request/Response)

### Task Schemas

```python
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

# Request: Create task
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)

# Request: Update task
class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)

# Response: Task data
class TaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Response: List of tasks
class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    count: int
```

---

## Data Isolation Constraints

Per constitution principles II and III:

1. **All Task queries MUST include user_id filter**
   ```python
   # CORRECT
   tasks = session.exec(
       select(Task).where(Task.user_id == authenticated_user_id)
   ).all()

   # FORBIDDEN - Never do this
   tasks = session.exec(select(Task)).all()
   ```

2. **Task ownership verification on single-item operations**
   ```python
   task = session.get(Task, task_id)
   if task.user_id != authenticated_user_id:
       raise HTTPException(403, "Forbidden")
   ```

3. **CASCADE delete ensures orphan prevention**
   - When a User is deleted, all their Tasks are automatically deleted
   - This is enforced at database level via foreign key constraint

---

## Migration Strategy

### Initial Migration (001_initial_schema.py)

Creates both tables with proper constraints:
1. Create `users` table
2. Create `tasks` table with foreign key
3. Create indexes

### Rollback Support

Each migration includes downgrade:
```python
def downgrade():
    op.drop_table('tasks')
    op.drop_table('users')
```

---

## Summary

| Entity | Primary Key | Foreign Keys | Indexes |
|--------|-------------|--------------|---------|
| User | id (UUID) | None | email |
| Task | id (UUID) | user_id → User.id | user_id, (user_id, is_completed) |

**Data Model Status**: Complete - Ready for API contract generation.
