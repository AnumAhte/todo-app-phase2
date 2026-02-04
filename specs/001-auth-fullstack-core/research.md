# Research: Authenticated Full-Stack Core (Phase I)

**Feature Branch**: `001-auth-fullstack-core`
**Date**: 2026-01-15
**Status**: Complete

## Research Topics

This document captures technology decisions and best practices research for the implementation plan.

---

## 1. Better Auth + JWT Integration

### Decision
Use Better Auth with JWT token mode for frontend authentication, with tokens forwarded to FastAPI backend.

### Rationale
- Better Auth is the prescribed authentication library per CLAUDE.md
- JWT mode enables stateless authentication suitable for separated frontend/backend
- Shared secret (BETTER_AUTH_SECRET) allows backend JWT verification without callback

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| NextAuth.js | Not specified in project requirements; Better Auth is mandated |
| Session-only auth | Requires session sharing between Next.js and FastAPI; adds complexity |
| Custom JWT implementation | Better Auth already provides battle-tested JWT handling |

### Implementation Notes
- Configure Better Auth with `jwt: { enabled: true }` in auth config
- Frontend stores JWT in httpOnly cookie (not localStorage per constitution)
- API client extracts JWT from cookie and adds to Authorization header
- Backend middleware verifies JWT signature using same secret

---

## 2. FastAPI JWT Verification Middleware

### Decision
Implement a custom FastAPI dependency that extracts and verifies JWT from Authorization header.

### Rationale
- FastAPI's dependency injection makes auth verification reusable across routes
- Custom middleware allows user_id extraction and URL matching per constitution
- python-jose library provides robust JWT verification

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| FastAPI-Users | Overkill for JWT-only verification; adds unnecessary database coupling |
| Middleware-only approach | Dependency injection allows per-route flexibility |
| Cookie-based verification | Bearer token in header is REST standard |

### Implementation Pattern
```python
# Dependency for protected routes
async def get_current_user(
    authorization: str = Header(...),
    user_id: str = Path(...)
) -> str:
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    if payload["sub"] != user_id:
        raise HTTPException(403, "Forbidden")
    return payload["sub"]
```

---

## 3. Neon PostgreSQL Connection Strategy

### Decision
Use SQLModel with async database sessions and Neon's connection pooling.

### Rationale
- Neon Serverless requires connection pooling for efficient serverless operation
- SQLModel provides typed models compatible with FastAPI's Pydantic
- Async sessions prevent blocking during database operations

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Raw SQLAlchemy | SQLModel is specified in CLAUDE.md; provides better FastAPI integration |
| Sync connections | May cause connection exhaustion in serverless environment |
| Prisma (Python) | Not mature; SQLModel is industry-standard for FastAPI |

### Connection String Format
```
postgresql+asyncpg://user:password@host/database?sslmode=require
```

### Pool Settings
- Pool size: 5 (Neon auto-scales)
- Max overflow: 10
- Pool recycle: 300 seconds

---

## 4. Next.js App Router + Better Auth Setup

### Decision
Use Next.js 16+ App Router with Better Auth route handler pattern.

### Rationale
- App Router is the modern Next.js pattern per CLAUDE.md requirements
- Route groups `(auth)` and `(dashboard)` enable layout separation
- Better Auth integrates via catch-all API route `[...all]`

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Pages Router | Legacy pattern; App Router is specified requirement |
| Middleware-only auth | Better Auth provides complete auth UI and API handling |

### Route Structure
- `/app/(auth)/login/page.tsx` - Public login page
- `/app/(auth)/signup/page.tsx` - Public signup page
- `/app/(dashboard)/tasks/page.tsx` - Protected task list
- `/app/api/auth/[...all]/route.ts` - Better Auth API handler

---

## 5. User-Scoped Data Isolation Pattern

### Decision
Enforce user_id filtering at three levels: URL path, JWT claim, and database query.

### Rationale
- Triple-layer verification ensures zero cross-user data leakage (constitution requirement)
- URL path makes ownership explicit in API design
- JWT claim provides cryptographic proof of identity
- Database WHERE clause is final defense

### Implementation Pattern

**API Route Design**:
```
GET    /api/{user_id}/tasks           # List user's tasks
POST   /api/{user_id}/tasks           # Create task for user
GET    /api/{user_id}/tasks/{id}      # Get specific task
PUT    /api/{user_id}/tasks/{id}      # Update specific task
DELETE /api/{user_id}/tasks/{id}      # Delete specific task
PATCH  /api/{user_id}/tasks/{id}/complete  # Toggle completion
```

**Verification Flow**:
1. Extract user_id from URL path parameter
2. Decode JWT and extract user_id claim
3. Compare: if URL user_id ≠ JWT user_id → 403 Forbidden
4. Query database: `WHERE user_id = authenticated_user_id`

---

## 6. API Response Status Codes

### Decision
Strictly follow HTTP semantics as defined in constitution Principle V.

### Rationale
- Consistent status codes enable reliable frontend error handling
- Constitution mandates specific codes for specific scenarios
- OpenAPI documentation depends on accurate status codes

### Status Code Mapping

| Scenario | Code | Body |
|----------|------|------|
| Successful read | 200 | Resource data |
| Successful create | 201 | Created resource |
| Successful delete | 204 | Empty |
| Successful update | 200 | Updated resource |
| Missing token | 401 | `{"detail": "Not authenticated"}` |
| Invalid token | 401 | `{"detail": "Invalid token"}` |
| User mismatch | 403 | `{"detail": "Forbidden"}` |
| Resource not found | 404 | `{"detail": "Not found"}` |
| Validation error | 422 | `{"detail": [...]}` |
| Server error | 500 | `{"detail": "Internal server error"}` |

---

## 7. Frontend API Client Pattern

### Decision
Create a typed API client that automatically injects JWT from auth session.

### Rationale
- Centralizes auth header injection
- TypeScript interfaces ensure type safety
- Handles token refresh automatically via Better Auth

### Implementation Pattern
```typescript
// lib/api.ts
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await auth.getSession();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
  });
}
```

---

## 8. Database Migration Strategy

### Decision
Use Alembic for database migrations with version-controlled migration files.

### Rationale
- Alembic is the standard migration tool for SQLAlchemy/SQLModel
- Version-controlled migrations ensure reproducible schema changes
- Supports both upgrade and downgrade paths

### Migration Commands
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## Summary

All research topics resolved. No "NEEDS CLARIFICATION" items remain.

| Topic | Decision | Status |
|-------|----------|--------|
| Auth strategy | Better Auth + JWT | ✅ Resolved |
| Backend auth | FastAPI dependency injection | ✅ Resolved |
| Database | Neon + SQLModel + async | ✅ Resolved |
| Frontend routing | App Router + route groups | ✅ Resolved |
| Data isolation | Triple-layer verification | ✅ Resolved |
| Status codes | HTTP semantics per constitution | ✅ Resolved |
| API client | Typed fetch with auto-auth | ✅ Resolved |
| Migrations | Alembic | ✅ Resolved |

**Research Phase Complete** - Ready for Phase 1 design artifacts.
