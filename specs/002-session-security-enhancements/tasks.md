# Tasks: Session & Security Enhancements (Phase II)

**Input**: Design documents from `/specs/002-session-security-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi-refresh.yaml

**Tests**: Not explicitly requested - test tasks NOT included. Manual verification via quickstart.md.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`
- **Frontend**: `frontend/lib/`, `frontend/app/`

---

## Phase 1: Setup (Configuration Updates)

**Purpose**: Update configuration and add new infrastructure files

- [x] T001 Add CLOCK_SKEW_SECONDS configuration to backend/app/config.py
- [x] T002 [P] Create auth event logging module in backend/app/auth/logging.py
- [x] T003 [P] Update backend/app/main.py to configure logging infrastructure
- [x] T004 Verify Better Auth version supports cookies in frontend/package.json

**Checkpoint**: Configuration ready - backend can log auth events, clock skew configurable

---

## Phase 2: Foundational (Backend JWT Enhancement)

**Purpose**: Core JWT middleware changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add clock skew tolerance (leeway) to JWT decode in backend/app/auth/dependencies.py
- [x] T006 Add auth event logging calls to backend/app/auth/dependencies.py for token verification events
- [x] T007 Update backend/app/auth/middleware.py to log authorization denied events (403)

**Checkpoint**: Backend JWT verification enhanced with clock skew tolerance and logging

---

## Phase 3: User Story 2 - Secure Token Storage (Priority: P1) 🎯 MVP

**Goal**: Configure Better Auth to store tokens in HTTP-only secure cookies with SameSite=Lax

**Independent Test**: Verify tokens are not accessible via `document.cookie` in browser console after login

### Implementation for User Story 2

- [x] T008 [US2] Configure Better Auth server with HTTP-only cookie settings in frontend/app/api/auth/[...all]/route.ts
- [x] T009 [US2] Add session configuration (15min access, 7day refresh) in frontend/app/api/auth/[...all]/route.ts
- [x] T010 [US2] Set SameSite=Lax and Secure flags in Better Auth cookie configuration
- [x] T011 [US2] Update frontend/lib/auth.ts to use cookie-based authentication

**Checkpoint**: Tokens stored securely in HTTP-only cookies, not accessible via JavaScript

---

## Phase 4: User Story 5 - Backend Token Verification (Priority: P1)

**Goal**: All API requests verified against valid tokens with proper rejection responses

**Independent Test**: Send requests with invalid/expired/missing tokens and verify 401 responses

### Implementation for User Story 5

- [x] T012 [US5] Verify JWT signature verification uses EdDSA algorithm in backend/app/auth/dependencies.py
- [x] T013 [US5] Ensure 401 response includes WWW-Authenticate header in backend/app/auth/dependencies.py
- [x] T014 [US5] Log AUTH_LOGIN_FAILURE events on token verification failure in backend/app/auth/dependencies.py
- [x] T015 [US5] Verify expired token rejection with clock skew tolerance in backend/app/auth/dependencies.py

**Checkpoint**: Backend properly rejects all invalid tokens with appropriate logging

---

## Phase 5: User Story 4 - User-Scoped Task Access (Priority: P1)

**Goal**: Users can only access their own tasks; other users' tasks are inaccessible

**Independent Test**: Create task as User A, login as User B, verify User B cannot see/modify User A's tasks

### Implementation for User Story 4

- [x] T016 [US4] Verify user_id filtering in GET /api/{user_id}/tasks endpoint in backend/app/routers/tasks.py
- [x] T017 [US4] Verify user_id validation in POST /api/{user_id}/tasks endpoint in backend/app/routers/tasks.py
- [x] T018 [US4] Verify user_id validation in PUT /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py
- [x] T019 [US4] Verify user_id validation in DELETE /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py
- [x] T020 [US4] Log AUTH_DENIED events when user attempts cross-user access in backend/app/auth/middleware.py

**Checkpoint**: All task endpoints enforce user-scoped access with logging

---

## Phase 6: User Story 1 - Seamless Session Persistence (Priority: P1)

**Goal**: Sessions persist with automatic token refresh when access token expires

**Independent Test**: Login, wait 15+ minutes (or set short expiry for testing), perform action - should succeed without re-login

### Implementation for User Story 1

- [x] T021 [US1] Implement refresh mutex/lock pattern in frontend/lib/api.ts to prevent concurrent refreshes
- [x] T022 [US1] Update fetchWithAuth to detect 401 and trigger refresh in frontend/lib/api.ts
- [x] T023 [US1] Implement attemptRefresh function using authClient.getSession in frontend/lib/api.ts
- [x] T024 [US1] Add retry logic for original request after successful refresh in frontend/lib/api.ts
- [x] T025 [US1] Log AUTH_TOKEN_REFRESH events in backend when refresh succeeds

**Checkpoint**: Access token automatically refreshes without user intervention

---

## Phase 7: User Story 3 - Graceful Session Expiration (Priority: P2)

**Goal**: Users redirected to login only when refresh token expires, with clear messaging

**Independent Test**: Let both tokens expire, attempt action - should redirect to login with "Session expired" message

### Implementation for User Story 3

- [x] T026 [US3] Handle refresh failure in frontend/lib/api.ts - clear auth state
- [x] T027 [US3] Create session expired redirect logic with message parameter in frontend/lib/api.ts
- [x] T028 [US3] Update login page to display session expired message from query param in frontend/app/(auth)/login/page.tsx
- [x] T029 [US3] Ensure logout clears all cookies via authClient.signOut in frontend/lib/auth-client.ts
- [x] T030 [US3] Log AUTH_LOGOUT events when user signs out in frontend/lib/auth-server.ts (via session delete hook)

**Checkpoint**: Session expiration handled gracefully with clear user communication

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, edge cases, and verification

- [x] T031 [P] Handle multiple browser tabs scenario - refresh mutex prevents duplicate requests
- [x] T032 [P] Add exponential backoff retry for network failures during refresh in frontend/lib/api.ts
- [ ] T033 Verify all Phase I task operations still work (regression test via quickstart.md)
- [ ] T034 Run complete quickstart.md validation checklist
- [x] T035 Update frontend/.env.local.example with any new environment variables (no changes needed)
- [x] T036 Update backend/.env.example with CLOCK_SKEW_SECONDS variable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3-7 (User Stories)**: All depend on Phase 2 completion
  - US2 (Secure Storage) should complete first as it sets up cookie infrastructure
  - US5 (Backend Verification) can run in parallel with US2
  - US4 (User-Scoped Access) can run after US5
  - US1 (Session Persistence) depends on US2 cookie setup
  - US3 (Graceful Expiration) depends on US1 refresh logic
- **Phase 8 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
       US2 (Cookies)              US5 (Backend Verify)
              ↓                         ↓
       US1 (Session)              US4 (User Scope)
              ↓
       US3 (Expiration)
              ↓
       Phase 8 (Polish)
```

### Parallel Opportunities

**Within Phase 1**:
- T002 and T003 can run in parallel (different files)

**After Phase 2 completes**:
- US2 and US5 can start in parallel (frontend vs backend work)
- US4 can start after US5 (backend-only)

**Within Phase 8**:
- T031 and T032 can run in parallel

---

## Parallel Example: Phase 1

```bash
# After T001 completes, launch in parallel:
Task: "Create auth event logging module in backend/app/auth/logging.py"
Task: "Update backend/app/main.py to configure logging infrastructure"
```

## Parallel Example: User Stories

```bash
# After Phase 2 completes, launch in parallel:
# Team A - Frontend Cookie Setup (US2)
Task: "Configure Better Auth server with HTTP-only cookie settings"

# Team B - Backend Verification (US5)
Task: "Verify JWT signature verification uses EdDSA algorithm"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 2 - Secure Token Storage
4. Complete Phase 4: User Story 5 - Backend Token Verification
5. Complete Phase 5: User Story 4 - User-Scoped Task Access
6. Complete Phase 6: User Story 1 - Seamless Session Persistence
7. **STOP and VALIDATE**: All P1 stories functional

### Incremental Delivery

1. Setup + Foundational → Backend enhanced
2. Add US2 → Cookies working → Test cookie security
3. Add US5 → Token verification → Test rejection cases
4. Add US4 → User isolation → Test cross-user denial
5. Add US1 → Session persistence → Test auto-refresh
6. Add US3 → Graceful expiration → Test logout/expiry flow
7. Polish → Edge cases → Full regression test

---

## Task Summary

| Phase | Story | Task Count | Description |
|-------|-------|------------|-------------|
| 1 | Setup | 4 | Configuration and infrastructure |
| 2 | Foundation | 3 | Backend JWT enhancement (blocking) |
| 3 | US2 (P1) | 4 | Secure cookie token storage |
| 4 | US5 (P1) | 4 | Backend token verification |
| 5 | US4 (P1) | 5 | User-scoped task access |
| 6 | US1 (P1) | 5 | Session persistence with refresh |
| 7 | US3 (P2) | 5 | Graceful session expiration |
| 8 | Polish | 6 | Edge cases and validation |
| **Total** | | **36** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No automated tests included - use quickstart.md for manual verification
- Phase I CRUD operations must remain functional throughout (SC-004)
