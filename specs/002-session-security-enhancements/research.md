# Phase 0 Research: Session & Security Enhancements

**Feature**: 002-session-security-enhancements
**Date**: 2026-01-28
**Status**: Complete

## Research Questions

### 1. Better Auth Cookie Storage Configuration

**Question**: How to configure Better Auth to store JWT tokens in HTTP-only secure cookies?

**Finding**: Better Auth v1.x provides native cookie configuration through the server-side `auth` configuration object.

**Configuration**:
```typescript
// frontend/app/api/auth/[...all]/route.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // ... other config
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "todo_",
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 15, // 15 minutes
    },
  },
});
```

**Cookie Attributes Set**:
- `httpOnly: true` (default)
- `secure: true` (when useSecureCookies enabled)
- `sameSite: "lax"` (configurable)
- `path: "/"` (default)

**Decision**: Use Better Auth's native cookie configuration
**Rationale**: No custom middleware needed; leverages battle-tested library code
**Alternatives Rejected**:
- Custom cookie middleware (unnecessary complexity)
- Client-side token storage with manual cookie setting (security risk)

---

### 2. Refresh Token Implementation

**Question**: How to implement refresh token flow with Better Auth?

**Finding**: Better Auth supports refresh tokens through session configuration.

**Server Configuration**:
```typescript
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 15, // Access token: 15 minutes
    updateAge: 60 * 5,  // Refresh access 5 min before expiry
    freshAge: 60 * 5,   // Consider "fresh" for 5 minutes
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});
```

**Refresh Behavior**:
- Better Auth automatically handles refresh when session nears expiry
- Client SDK's `useSession()` hook triggers refresh automatically
- Manual refresh available via `authClient.getSession({ update: true })`

**Decision**: Use Better Auth's built-in session refresh mechanism
**Rationale**: Automatic refresh without custom endpoint; secure by default
**Alternatives Rejected**:
- Custom refresh endpoint (reinventing existing functionality)
- Manual refresh timer (error-prone, battery drain on mobile)

---

### 3. Frontend 401 Handling Pattern

**Question**: How to handle 401 responses with automatic refresh and request retry?

**Finding**: Implement a fetch wrapper with refresh capability and mutex for concurrent requests.

**Pattern**:
```typescript
// Mutex to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, options);

  if (response.status === 401) {
    // Try to refresh
    const refreshed = await attemptRefresh();
    if (refreshed) {
      // Retry original request
      return fetch(endpoint, options).then(r => r.json());
    }
    // Refresh failed - redirect to login
    throw new AuthError("SESSION_EXPIRED");
  }

  return response.json();
}

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    // Wait for existing refresh
    return refreshPromise!;
  }

  isRefreshing = true;
  refreshPromise = authClient.getSession({ update: true })
    .then(session => !!session)
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}
```

**Decision**: Fetch interceptor with mutex pattern
**Rationale**: Transparent UX; handles concurrent tab/request scenarios
**Alternatives Rejected**:
- Immediate redirect to login (poor UX)
- Server-side request queuing (stateful, complex)

---

### 4. Clock Skew Tolerance in PyJWT

**Question**: How to implement clock skew tolerance for JWT validation?

**Finding**: PyJWT supports `leeway` parameter in `decode()` function.

**Implementation**:
```python
import jwt

CLOCK_SKEW_SECONDS = 30

payload = jwt.decode(
    token,
    signing_key.key,
    algorithms=["EdDSA"],
    leeway=CLOCK_SKEW_SECONDS,  # Allows 30 second clock drift
)
```

**Behavior**:
- `leeway` applies to both `exp` (expiration) and `nbf` (not before) claims
- Token accepted if current time is within leeway of valid range
- Standard JWT library feature, no custom code needed

**Decision**: Use PyJWT's `leeway` parameter set to 30 seconds
**Rationale**: Standard library feature; matches spec requirement SC-007
**Alternatives Rejected**:
- Manual timestamp comparison (error-prone)
- Server time synchronization enforcement (not always possible)

---

### 5. Concurrent Refresh Request Handling

**Question**: How to prevent race conditions when multiple browser tabs attempt refresh?

**Finding**: Two complementary approaches:

**Frontend (Primary)**:
- Mutex pattern in API client (see Research #3)
- Single refresh attempt shared across all pending requests

**Backend (Secondary)**:
- Better Auth generates new session on refresh
- Old session invalidated, preventing replay
- No server-side mutex needed

**Decision**: Frontend mutex pattern with Better Auth's session management
**Rationale**: Simple, stateless solution; no server coordination needed
**Alternatives Rejected**:
- Server-side session locking (adds state, complexity)
- Redis-based refresh deduplication (overkill for this use case)

---

### 6. Auth Event Logging

**Question**: What logging approach for security-relevant auth events?

**Finding**: Python's standard `logging` module with structured JSON output.

**Implementation**:
```python
import logging
import json
from datetime import datetime

auth_logger = logging.getLogger("auth")

def log_auth_event(event_type: str, user_id: str = None, **details):
    auth_logger.info(json.dumps({
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": str(user_id) if user_id else None,
        **details
    }))
```

**Event Types**:
| Event | Trigger | Fields |
|-------|---------|--------|
| AUTH_LOGIN_SUCCESS | Successful login | user_id, ip |
| AUTH_LOGIN_FAILURE | Failed login | email_hash, ip, reason |
| AUTH_TOKEN_REFRESH | Token refreshed | user_id |
| AUTH_LOGOUT | User logged out | user_id |
| AUTH_DENIED | 403 response | user_id, resource |

**Decision**: Structured JSON logging via Python logging module
**Rationale**: Standard library; easily parsed by log aggregators
**Alternatives Rejected**:
- Database logging (performance impact)
- External logging service (adds dependency)

---

## Summary

All research questions resolved. No blockers identified for implementation.

| Topic | Decision | Risk Level |
|-------|----------|------------|
| Cookie storage | Better Auth native | Low |
| Refresh tokens | Better Auth session config | Low |
| 401 handling | Fetch interceptor + mutex | Low |
| Clock skew | PyJWT leeway parameter | Low |
| Concurrent refresh | Frontend mutex | Low |
| Auth logging | Python logging module | Low |
