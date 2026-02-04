# Quickstart: Session & Security Enhancements Testing Guide

**Feature**: 002-session-security-enhancements
**Date**: 2026-01-28

## Prerequisites

- Phase I (001-auth-fullstack-core) fully implemented and working
- Node.js 20+ and Python 3.11+ installed
- Neon PostgreSQL database accessible
- Both frontend and backend environment variables configured

## Environment Setup

### Backend (.env)

```bash
# Existing from Phase I
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require
BETTER_AUTH_URL=http://localhost:3000

# New for Phase II
CLOCK_SKEW_SECONDS=30
LOG_LEVEL=INFO
```

### Frontend (.env.local)

```bash
# Existing from Phase I
BETTER_AUTH_SECRET=<your-secret-key>
NEXT_PUBLIC_API_URL=http://localhost:8000

# New for Phase II (in auth config)
# Cookie settings are configured in code, not env vars
```

## Starting the Application

```bash
# Terminal 1: Backend
cd backend
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Testing Checklist

### 1. Cookie Storage Verification

**Test**: Verify tokens are stored in HTTP-only cookies

```
1. Open browser DevTools → Application → Cookies
2. Sign in to the application
3. Verify cookies exist:
   - `todo_session_token` (access token)
   - `todo_session_data` (session data)
4. Verify cookie attributes:
   - httpOnly: true (not editable in DevTools)
   - sameSite: Lax
   - secure: true (if on HTTPS)
5. Open Console tab and run: `document.cookie`
6. Verify NO auth tokens appear in the output (HTTP-only working)
```

**Expected**: Tokens visible in Application tab but NOT accessible via JavaScript

### 2. Session Persistence Test

**Test**: Verify session persists across page reloads

```
1. Sign in to the application
2. Navigate to tasks page
3. Close and reopen browser tab
4. Verify still logged in (no redirect to login)
5. Create/view tasks - should work without re-authentication
```

**Expected**: Session persists; no login prompt after reload

### 3. Access Token Expiration Test

**Test**: Verify automatic refresh when access token expires

```
1. Sign in to the application
2. Note the time
3. Wait 15+ minutes OR modify token expiry to 1 minute for testing
4. Perform an action (create task, load list)
5. Check Network tab for:
   - Initial 401 response (optional, may be transparent)
   - Refresh request to /api/auth/get-session
   - Retry of original request
6. Verify action completes successfully
```

**Expected**: Action succeeds without visible error; new cookie set

### 4. Refresh Token Expiration Test

**Test**: Verify redirect to login when refresh token expires

```
1. Sign in to the application
2. Clear the refresh token cookie manually OR wait 7 days
3. Wait for access token to expire (15 min)
4. Perform an action
5. Verify redirect to login page
6. Verify "Session expired" message displayed
```

**Expected**: Clean redirect to login with informative message

### 5. Multiple Tab Test

**Test**: Verify concurrent refresh handling

```
1. Sign in to the application
2. Open same app in 3+ browser tabs
3. Wait for access token to expire
4. Quickly perform actions in all tabs simultaneously
5. Check Network tab - only ONE refresh request should occur
6. All tabs should continue working
```

**Expected**: Single refresh request; all tabs remain authenticated

### 6. User-Scoped Access Test

**Test**: Verify users cannot access other users' tasks

```
1. Create User A and add some tasks
2. Note a task ID from User A
3. Sign out and create User B
4. Try to access User A's task:
   - Via API: GET /api/<userA-id>/tasks/<taskId>
   - Via URL manipulation
5. Verify 403 Forbidden or 404 Not Found response
```

**Expected**: Access denied; no data leakage

### 7. Backend Token Verification Test

**Test**: Verify backend rejects invalid tokens

```bash
# Test 1: No token
curl -X GET http://localhost:8000/api/<user-id>/tasks
# Expected: 401 Unauthorized

# Test 2: Invalid token
curl -X GET http://localhost:8000/api/<user-id>/tasks \
  -H "Authorization: Bearer invalid.token.here"
# Expected: 401 Unauthorized

# Test 3: Expired token (get a valid token, wait for expiry)
curl -X GET http://localhost:8000/api/<user-id>/tasks \
  -H "Authorization: Bearer <expired-token>"
# Expected: 401 Unauthorized

# Test 4: Tampered token (modify payload of valid token)
curl -X GET http://localhost:8000/api/<user-id>/tasks \
  -H "Authorization: Bearer <tampered-token>"
# Expected: 401 Unauthorized
```

**Expected**: All invalid tokens rejected with 401

### 8. Clock Skew Tolerance Test

**Test**: Verify 30-second clock skew tolerance

```python
# In Python test file or REPL
import jwt
import time
from datetime import datetime, timedelta

# Create token expiring 25 seconds ago (within tolerance)
token = jwt.encode({
    "sub": "<user-id>",
    "exp": datetime.utcnow() - timedelta(seconds=25),
    "iat": datetime.utcnow() - timedelta(minutes=15, seconds=25)
}, "<secret>", algorithm="HS256")

# This token should still be accepted (within 30s leeway)
```

**Expected**: Token accepted if within 30-second window

### 9. Auth Logging Test

**Test**: Verify security events are logged

```bash
# Watch backend logs while performing actions
# Terminal: uvicorn app.main:app --reload --port 8000

# Perform these actions and check logs:
1. Successful login → AUTH_LOGIN_SUCCESS
2. Failed login (wrong password) → AUTH_LOGIN_FAILURE
3. Token refresh → AUTH_TOKEN_REFRESH
4. Logout → AUTH_LOGOUT
5. Access denied (try accessing other user's task) → AUTH_DENIED
```

**Expected**: JSON-formatted log entries for each event

### 10. Logout Test

**Test**: Verify complete token clearing on logout

```
1. Sign in to the application
2. Open DevTools → Application → Cookies
3. Note the auth cookies present
4. Click Logout
5. Verify:
   - All auth cookies cleared/expired
   - Redirected to login page
   - Accessing protected routes redirects to login
   - document.cookie shows no auth tokens
```

**Expected**: Clean logout; no residual authentication

## Regression Tests

After implementing Phase II, verify Phase I features still work:

- [ ] User registration (signup)
- [ ] User login
- [ ] Create task
- [ ] View task list
- [ ] Update task title/description
- [ ] Mark task complete/incomplete
- [ ] Delete task
- [ ] User-scoped data (User A can't see User B's tasks)

## Troubleshooting

### Cookies not being set

1. Check CORS configuration allows credentials
2. Verify `sameSite` and `secure` settings match environment
3. Check for cookie size limits (4KB max)

### 401 errors after refresh

1. Verify BETTER_AUTH_SECRET matches in frontend and backend
2. Check clock synchronization between servers
3. Verify refresh token hasn't expired

### Multiple refresh requests

1. Check mutex implementation in frontend API client
2. Verify single auth client instance across app

### Logs not appearing

1. Verify LOG_LEVEL environment variable
2. Check logging configuration in main.py
3. Ensure auth_logger is imported in auth modules
