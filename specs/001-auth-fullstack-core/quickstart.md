# Quickstart Guide: Authenticated Full-Stack Core (Phase I)

**Feature Branch**: `001-auth-fullstack-core`
**Date**: 2026-01-15

This guide covers development environment setup and verification for the multi-user Todo application.

---

## Prerequisites

- **Node.js**: 20.x or later
- **Python**: 3.11 or later
- **PostgreSQL client**: For database verification
- **Git**: For version control

---

## Environment Setup

### 1. Clone and Checkout

```bash
git clone <repository-url>
cd Todo-phase2
git checkout 001-auth-fullstack-core
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# DATABASE_URL=postgresql+asyncpg://user:pass@host/db?sslmode=require
# JWT_SECRET=<your-better-auth-secret>
# ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your values:
# BETTER_AUTH_SECRET=<same-secret-as-backend>
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Database Setup

```bash
cd backend

# Run migrations
alembic upgrade head

# Verify tables created
# Connect to your Neon database and check:
# - users table exists
# - tasks table exists with user_id foreign key
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

API documentation at: http://localhost:8000/docs

### Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## Verification Checklist

Use this checklist to verify the implementation works correctly.

### Authentication Flow

- [ ] Navigate to http://localhost:3000
- [ ] Click "Sign Up" and create a new account
- [ ] Verify redirect to task dashboard after signup
- [ ] Log out and log back in
- [ ] Verify session persists after page refresh

### Task CRUD Operations

- [ ] Create a new task (enter title, submit)
- [ ] Verify task appears in list
- [ ] Mark task as complete (click checkbox)
- [ ] Verify completion status changes
- [ ] Edit task title
- [ ] Verify title updates
- [ ] Delete task
- [ ] Verify task removed from list

### Data Isolation (requires 2 accounts)

- [ ] Create Account A, add tasks
- [ ] Log out, create Account B
- [ ] Verify Account B cannot see Account A's tasks
- [ ] Attempt to access Account A's task via URL manipulation
- [ ] Verify 403 Forbidden response

### API Direct Testing

```bash
# Get auth token (after login, extract from browser devtools)
TOKEN="your-jwt-token-here"
USER_ID="your-user-id-here"

# List tasks
curl -X GET "http://localhost:8000/api/${USER_ID}/tasks" \
  -H "Authorization: Bearer ${TOKEN}"

# Create task
curl -X POST "http://localhost:8000/api/${USER_ID}/tasks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task"}'

# Test without token (should return 401)
curl -X GET "http://localhost:8000/api/${USER_ID}/tasks"

# Test wrong user (should return 403)
curl -X GET "http://localhost:8000/api/wrong-user-id/tasks" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## Running Tests

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## Common Issues

### "Connection refused" on API calls

- Verify backend is running on port 8000
- Check CORS settings in backend allow http://localhost:3000
- Verify NEXT_PUBLIC_API_URL in frontend .env.local

### "Invalid token" errors

- Ensure JWT_SECRET in backend matches BETTER_AUTH_SECRET in frontend
- Check token hasn't expired
- Verify token is being sent in Authorization header

### Database connection errors

- Verify DATABASE_URL is correct in backend .env
- Check Neon database is active (not suspended)
- Ensure SSL mode is set to "require"

### "Forbidden" on own resources

- Verify user_id in URL matches the logged-in user
- Check JWT token contains correct user_id claim
- Ensure Better Auth is configured to include user ID in token

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql+asyncpg://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Shared secret for JWT verification | `your-secret-key-min-32-chars` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Shared secret (same as JWT_SECRET) | `your-secret-key-min-32-chars` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |

---

## Success Criteria Verification

| Criterion | How to Verify |
|-----------|---------------|
| SC-001: Auth < 30 seconds | Time signup/login flow |
| SC-002: Task list < 2 seconds | Check network tab for list API |
| SC-003: CRUD < 1 second | Check network tab for each operation |
| SC-004: 401 on no token | Test API without Authorization header |
| SC-005: 403 on wrong user | Test API with mismatched user_id |
| SC-006: Zero data leakage | Login as different users, verify isolation |
| SC-007: All 5 operations work | Complete task CRUD checklist above |
| SC-008: Session persists | Refresh page while logged in |
| SC-009: Data persists | Restart servers, verify tasks remain |
| SC-010: Independent testing | Run backend tests without frontend |

---

## Next Steps

After verification:

1. Run `/sp.tasks` to generate implementation task breakdown
2. Follow task list in priority order
3. Commit after each task completion
4. Re-run verification checklist after implementation
