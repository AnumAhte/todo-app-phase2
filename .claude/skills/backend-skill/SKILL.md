---
name: backend-skill
description: Build and manage backend REST APIs, handle request/response flows, and integrate with databases.
---

# Backend Skill – API & Data Integration

## Instructions

1. **API Routes**
   - Design RESTful endpoints
   - Follow consistent URL and versioning patterns
   - Implement proper HTTP methods and status codes
   - Structure routes for scalability and maintainability

2. **Request / Response Handling**
   - Validate incoming requests
   - Serialize and deserialize responses
   - Handle errors and edge cases gracefully
   - Enforce consistent response formats

3. **Database Integration**
   - Connect backend services to PostgreSQL (Neon)
   - Execute queries and transactions safely
   - Map database models to API schemas
   - Handle connection pooling and timeouts

4. **Business Logic Layer**
   - Separate routing, service, and data access layers
   - Implement reusable service functions
   - Enforce authorization checks at API boundaries

## Best Practices
- Validate everything at the API boundary
- Never expose internal errors directly to clients
- Use transactions for multi-step operations
- Keep controllers thin, services thick
- Log and monitor all critical API actions

## Example Structure
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db import get_db

router = APIRouter()

class UserOut(BaseModel):
    id: str
    email: str

@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: str, db=Depends(get_db)):
    user = db.fetch_user(user_id)
    return user
