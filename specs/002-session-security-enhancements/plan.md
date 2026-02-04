# Implementation Plan: Session & Security Enhancements (Phase II)

**Branch**: `002-session-security-enhancements` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-session-security-enhancements/spec.md`

## Summary

Enhance the Phase I authentication system with:
- HTTP-only secure cookie storage for JWT tokens (replacing client-accessible token storage)
- Refresh token implementation with automatic renewal flow
- Backend JWT middleware enhancement with clock skew tolerance
- Frontend API client with automatic 401 handling and token refresh
- Security-relevant auth event logging

All changes preserve existing Phase I CRUD functionality while adding robust session management for 7-day persistent sessions.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x with Node.js 20+
- Backend: Python 3.11+

**Primary Dependencies**:
- Frontend: Next.js 16+ (App Router), Better Auth (with cookie storage plugin)
- Backend: FastAPI, SQLModel, PyJWT, python-jose
- New: python-logging for auth events

**Storage**: Neon Serverless PostgreSQL (existing from Phase I)

**Testing**:
- Frontend: Jest, React Testing Library
- Backend: pytest, httpx (for API testing)

**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

**Project Type**: Web application (frontend + backend separated)

**Performance Goals**:
- Token refresh: < 2 seconds (99th percentile)
- Automatic retry success: 95%+ of token expiration cases

**Constraints**:
- HTTP-only cookies for token storage (FR-001)
- SameSite=Lax for CSRF protection (Clarification)
- 30-second clock skew tolerance (FR-010)
- Identical BETTER_AUTH_SECRET in frontend/backend (FR-013)

**Scale/Scope**:
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days
- Multi-user with user-scoped data isolation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Evidence |
|-----------|-------------|--------|----------|
| I. Spec-Driven Development | Complete spec before planning | ✅ PASS | spec.md created with 14 FRs, 8 SCs, clarified |
| II. Security-First Design | JWT verification, user isolation | ✅ PASS | FR-001 HTTP-only cookies, FR-003 signature verification |
| III. JWT Authentication Protocol | Token verification in middleware | ✅ PASS | FR-003-004 require JWT validation, FR-010 clock skew |
| IV. Clean Architecture | Separated frontend/backend | ✅ PASS | Enhances existing Phase I separation |
| V. API Contract Compliance | RESTful HTTP semantics | ✅ PASS | Preserves existing API, adds refresh endpoint |
| VI. Deterministic Builds | Lock files, version pinning | ✅ PASS | Updates to existing lock files |
| VII. Typed Data Models | SQLModel, TypeScript, Pydantic | ✅ PASS | No schema changes, typed token interfaces |
| VIII. Production Readiness | Modular structure, logging | ✅ PASS | FR-014 adds auth logging, modular middleware |

**Gate Result**: PASS - All 8 constitution principles satisfied. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-session-security-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (token entities)
├── quickstart.md        # Phase 1 output (testing guide)
├── contracts/           # Phase 1 output
│   └── openapi-refresh.yaml  # Refresh token endpoint spec
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (changes to existing structure)

```text
backend/
├── app/
│   ├── auth/
│   │   ├── dependencies.py    # MODIFY: Add clock skew tolerance
│   │   ├── middleware.py      # MODIFY: Enhance verification
│   │   └── logging.py         # NEW: Auth event logging
│   ├── config.py              # MODIFY: Add token config
│   └── main.py                # MODIFY: Configure logging
└── requirements.txt           # MODIFY: Add logging deps if needed

frontend/
├── app/
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts   # MODIFY: Cookie configuration
├── lib/
│   ├── auth.ts                # MODIFY: Cookie storage config
│   ├── auth-client.ts         # MODIFY: Add refresh handling
│   └── api.ts                 # MODIFY: 401 handling with refresh
└── package.json               # VERIFY: Better Auth version
```

**Structure Decision**: Minimal changes to existing web application structure. No new directories needed except `backend/app/auth/logging.py` for auth event logging.

## Complexity Tracking

No constitution violations requiring justification. Changes enhance existing architecture without adding structural complexity.

## Phase 0: Research Summary

### Research Topics

1. **Better Auth Cookie Storage Configuration**
   - Decision: Use Better Auth's built-in cookie options with `useSecureCookies` and `sameSite` configuration
   - Rationale: Better Auth v1.x supports HTTP-only secure cookies natively
   - Alternatives: Custom cookie middleware (rejected - unnecessary complexity)

2. **Refresh Token Implementation in Better Auth**
   - Decision: Enable Better Auth's refresh token plugin on server config
   - Rationale: Built-in support for refresh tokens with configurable expiry
   - Alternatives: Custom refresh endpoint (rejected - reinventing existing functionality)

3. **Frontend 401 Handling Pattern**
   - Decision: Implement fetch interceptor with automatic refresh and request retry
   - Rationale: Transparent UX - user doesn't see intermediate failures
   - Alternatives: Redirect to login immediately (rejected - poor UX)

4. **Clock Skew Tolerance in PyJWT**
   - Decision: Use PyJWT's `leeway` parameter (30 seconds)
   - Rationale: Standard JWT library feature, no custom code needed
   - Alternatives: Manual timestamp comparison (rejected - error-prone)

5. **Concurrent Refresh Request Handling**
   - Decision: Implement refresh lock/mutex pattern in frontend API client
   - Rationale: Prevents race conditions when multiple tabs refresh simultaneously
   - Alternatives: Server-side deduplication (rejected - more complex, stateful)

See [research.md](./research.md) for detailed findings.

## Phase 1: Design Artifacts

### Token Configuration

| Token Type | Lifetime | Storage | Flags |
|------------|----------|---------|-------|
| Access Token | 15 minutes | HTTP-only cookie | Secure (prod), SameSite=Lax, Path=/ |
| Refresh Token | 7 days | HTTP-only cookie | Secure (prod), SameSite=Lax, Path=/api/auth |

### Cookie Attributes

```
access_token:
  httpOnly: true
  secure: true (production) / false (development)
  sameSite: Lax
  path: /
  maxAge: 900 (15 minutes)

refresh_token:
  httpOnly: true
  secure: true (production) / false (development)
  sameSite: Lax
  path: /api/auth
  maxAge: 604800 (7 days)
```

### Auth Event Logging Schema

```
Event Types:
- AUTH_LOGIN_SUCCESS: User logged in successfully
- AUTH_LOGIN_FAILURE: Login attempt failed (bad credentials)
- AUTH_TOKEN_REFRESH: Access token refreshed
- AUTH_TOKEN_REFRESH_FAILURE: Refresh token invalid/expired
- AUTH_LOGOUT: User logged out
- AUTH_DENIED: Authorization denied (403)

Log Fields:
- timestamp: ISO 8601
- event_type: string
- user_id: UUID (if available)
- ip_address: string (masked for privacy)
- user_agent: string (truncated)
- details: object (event-specific)
```

### API Changes

**New Endpoint** (provided by Better Auth, configured):
```
POST /api/auth/refresh
Cookie: refresh_token=<token>
Response: Sets new access_token cookie
```

**Modified Behavior**:
- All auth endpoints now use HTTP-only cookies instead of response body tokens
- Frontend receives tokens via Set-Cookie headers, not JSON

### Frontend Refresh Flow

```
1. API request fails with 401
2. Check if refresh is already in progress (mutex)
3. If not, acquire lock and call /api/auth/refresh
4. If refresh succeeds:
   - Release lock
   - Retry original request
   - Notify waiting requests
5. If refresh fails:
   - Release lock
   - Clear auth state
   - Redirect to login with "Session expired" message
```

## Architecture Diagrams

### Token Flow (Happy Path)

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│ Browser │     │ Next.js  │     │ FastAPI │     │   Neon   │
└────┬────┘     └────┬─────┘     └────┬────┘     └────┬─────┘
     │               │                │               │
     │ Login Request │                │               │
     │──────────────>│                │               │
     │               │ Set-Cookie:    │               │
     │               │ access_token   │               │
     │               │ refresh_token  │               │
     │<──────────────│                │               │
     │               │                │               │
     │ API Request   │                │               │
     │ (with cookie) │                │               │
     │──────────────>│ Forward JWT    │               │
     │               │───────────────>│ Verify JWT    │
     │               │                │ Query DB      │
     │               │                │──────────────>│
     │               │                │<──────────────│
     │               │<───────────────│               │
     │<──────────────│                │               │
```

### Token Refresh Flow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐
│ Browser │     │ Next.js  │     │ Better Auth │
└────┬────┘     └────┬─────┘     └──────┬──────┘
     │               │                  │
     │ API Request   │                  │
     │──────────────>│                  │
     │   401 Error   │                  │
     │<──────────────│                  │
     │               │                  │
     │ Refresh (auto)│                  │
     │──────────────>│ Validate refresh│
     │               │─────────────────>│
     │               │ New access_token│
     │               │<─────────────────│
     │ Set-Cookie    │                  │
     │<──────────────│                  │
     │               │                  │
     │ Retry Request │                  │
     │──────────────>│                  │
     │   Success     │                  │
     │<──────────────│                  │
```

## Risk Mitigations

| Risk | Mitigation Implemented |
|------|------------------------|
| Better Auth cookie limitations | Researched in Phase 0; using native cookie support |
| Clock sync issues | 30-second leeway in PyJWT decode |
| Concurrent refresh race | Frontend mutex pattern |
| Breaking Phase I | Backward-compatible changes; regression tests |

## Design Artifacts

- [research.md](./research.md) - Technology research and decisions
- [data-model.md](./data-model.md) - Token entity definitions
- [contracts/openapi-refresh.yaml](./contracts/openapi-refresh.yaml) - Refresh endpoint specification
- [quickstart.md](./quickstart.md) - Testing and verification guide

## Next Steps

Run `/sp.tasks` to generate implementation task breakdown.
