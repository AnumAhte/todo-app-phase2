# Tasks: Authenticated Full-Stack Core (Phase I)

**Input**: Design documents from `/specs/001-auth-fullstack-core/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/openapi.yaml ✅

**Tests**: Tests are NOT explicitly requested in the specification. This task list focuses on implementation only. Tests can be added later if requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` for FastAPI, `frontend/` for Next.js
- Paths follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both frontend and backend

- [x] T001 Create backend directory structure per plan.md in backend/
- [x] T002 Create frontend directory structure per plan.md in frontend/
- [x] T003 [P] Initialize Python virtual environment and create backend/requirements.txt with FastAPI, SQLModel, PyJWT, python-jose, asyncpg, alembic, uvicorn, httpx
- [x] T004 [P] Initialize Next.js 16+ project with TypeScript in frontend/ and create package.json with better-auth, react dependencies
- [x] T005 [P] Create backend/.env.example with DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS placeholders
- [x] T006 [P] Create frontend/.env.local.example with BETTER_AUTH_SECRET, NEXT_PUBLIC_API_URL placeholders
- [x] T007 [P] Configure backend linting with ruff.toml in backend/
- [x] T008 [P] Configure frontend linting and TypeScript with tsconfig.json and .eslintrc.json in frontend/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [x] T009 Create backend/app/__init__.py (empty init)
- [x] T010 Implement environment configuration in backend/app/config.py with Settings class (DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS)
- [x] T011 Implement Neon PostgreSQL async connection pool in backend/app/database.py using SQLModel and asyncpg
- [x] T012 [P] Create User SQLModel in backend/app/models/user.py per data-model.md (id, email, name, timestamps)
- [x] T013 [P] Create Task SQLModel in backend/app/models/task.py per data-model.md (id, user_id, title, is_completed, timestamps)
- [x] T014 Create backend/app/models/__init__.py exporting User and Task models
- [x] T015 Initialize Alembic migrations in backend/alembic/ with alembic.ini configuration
- [x] T016 Create initial migration in backend/alembic/versions/001_initial_schema.py for users and tasks tables
- [x] T017 Implement JWT verification dependency in backend/app/auth/dependencies.py (extract token, decode, verify signature, return user_id)
- [x] T018 Implement auth middleware in backend/app/auth/middleware.py for user_id URL matching verification
- [x] T019 Create backend/app/auth/__init__.py exporting get_current_user dependency
- [x] T020 Create FastAPI app entry point in backend/app/main.py with CORS config and router mounting
- [x] T021 Create backend/app/routers/__init__.py (empty init)

### Frontend Foundation

- [x] T022 Configure Better Auth client in frontend/lib/auth.ts with JWT mode enabled
- [x] T023 Create typed API client with JWT injection in frontend/lib/api.ts (fetchWithAuth function)
- [x] T024 Define TypeScript interfaces in frontend/lib/types.ts (User, Task, TaskCreate, TaskUpdate per data-model.md)
- [x] T025 Create root layout with auth provider in frontend/app/layout.tsx
- [x] T026 Create landing page with redirect logic in frontend/app/page.tsx (redirect to /login or /tasks)
- [x] T027 Create Better Auth API route handler in frontend/app/api/auth/[...all]/route.ts

### Pydantic Schemas (for API validation)

- [x] T028 [P] Create User Pydantic schemas in backend/app/schemas/user.py (UserCreate, UserResponse)
- [x] T029 [P] Create Task Pydantic schemas in backend/app/schemas/task.py (TaskCreate, TaskUpdate, TaskResponse, TaskListResponse per contracts/openapi.yaml)
- [x] T030 Create backend/app/schemas/__init__.py exporting all schemas

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - User Registration and Login (Priority: P1) 🎯 MVP

**Goal**: Enable users to create accounts, sign in, and maintain sessions

**Independent Test**: Create an account, log in, refresh page (session persists), log out, verify redirect to login

### Implementation for User Story 1

- [x] T031 [US1] Create signup page UI in frontend/app/(auth)/signup/page.tsx with email, password, name fields and form validation
- [x] T032 [US1] Create login page UI in frontend/app/(auth)/login/page.tsx with email, password fields and error handling
- [x] T033 [US1] Create shared AuthForm component in frontend/components/AuthForm.tsx for login/signup forms
- [x] T034 [US1] Implement logout functionality in frontend/components/LogoutButton.tsx with session termination
- [x] T035 [US1] Create protected dashboard layout in frontend/app/(dashboard)/layout.tsx with auth check and redirect
- [x] T036 [US1] Add session persistence verification - ensure auth state survives page refresh via Better Auth
- [x] T037 [US1] Implement error display for invalid credentials on login page

**Checkpoint**: User Story 1 complete - users can register, login, logout, and sessions persist

---

## Phase 4: User Story 2 - View My Tasks (Priority: P2)

**Goal**: Enable authenticated users to see their task list with empty state handling

**Independent Test**: Log in, navigate to /tasks, see task list (or empty state message for new users), verify no other users' tasks visible

### Implementation for User Story 2

- [x] T038 [US2] Implement GET /api/{user_id}/tasks endpoint in backend/app/routers/tasks.py with user_id filtering per contracts/openapi.yaml
- [x] T039 [US2] Create tasks page in frontend/app/(dashboard)/tasks/page.tsx with data fetching
- [x] T040 [US2] Create TaskList component in frontend/components/TaskList.tsx displaying tasks with title and completion status
- [x] T041 [US2] Create TaskItem component in frontend/components/TaskItem.tsx for individual task display
- [x] T042 [US2] Implement empty state UI in TaskList when user has no tasks
- [x] T043 [US2] Add unauthenticated access redirect - verify /tasks redirects to /login when not authenticated

**Checkpoint**: User Story 2 complete - users can view their task list with proper isolation

---

## Phase 5: User Story 3 - Add a New Task (Priority: P3)

**Goal**: Enable authenticated users to create new tasks

**Independent Test**: Log in, create a task with title, verify it appears in task list immediately

### Implementation for User Story 3

- [x] T044 [US3] Implement POST /api/{user_id}/tasks endpoint in backend/app/routers/tasks.py with 201 response per contracts/openapi.yaml
- [x] T045 [US3] Create TaskForm component in frontend/components/TaskForm.tsx with title input and submit
- [x] T046 [US3] Add validation for empty title (display error, prevent submission)
- [x] T047 [US3] Integrate TaskForm into tasks page with optimistic UI update on creation
- [x] T048 [US3] Verify task persists across sessions (log out, log in, task still exists)

**Checkpoint**: User Story 3 complete - users can create tasks with validation

---

## Phase 6: User Story 4 - Update a Task (Priority: P4)

**Goal**: Enable authenticated users to edit task titles

**Independent Test**: Edit an existing task's title, verify change persists after page refresh

### Implementation for User Story 4

- [x] T049 [US4] Implement GET /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py per contracts/openapi.yaml
- [x] T050 [US4] Implement PUT /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py with ownership verification
- [x] T051 [US4] Add edit mode to TaskItem component with inline editing or modal
- [x] T052 [US4] Add validation for empty title on update (422 response from backend)
- [x] T053 [US4] Verify 403 response when attempting to update another user's task (backend enforcement)

**Checkpoint**: User Story 4 complete - users can update their task titles

---

## Phase 7: User Story 5 - Delete a Task (Priority: P5)

**Goal**: Enable authenticated users to delete tasks they own

**Independent Test**: Delete a task, verify it's removed from list and cannot be retrieved

### Implementation for User Story 5

- [x] T054 [US5] Implement DELETE /api/{user_id}/tasks/{task_id} endpoint in backend/app/routers/tasks.py with 204 response
- [x] T055 [US5] Add delete button/action to TaskItem component with confirmation
- [x] T056 [US5] Implement optimistic UI removal on delete
- [x] T057 [US5] Verify 403 response when attempting to delete another user's task
- [x] T058 [US5] Verify 404 response when deleting non-existent task

**Checkpoint**: User Story 5 complete - users can delete their tasks

---

## Phase 8: User Story 6 - Mark Task Complete/Incomplete (Priority: P6)

**Goal**: Enable users to toggle task completion status

**Independent Test**: Toggle task completion, verify visual change and persistence

### Implementation for User Story 6

- [x] T059 [US6] Implement PATCH /api/{user_id}/tasks/{task_id}/complete endpoint in backend/app/routers/tasks.py for toggle
- [x] T060 [US6] Add completion toggle UI (checkbox or button) to TaskItem component
- [x] T061 [US6] Style completed tasks differently (strikethrough, muted color, or checkmark)
- [x] T062 [US6] Verify 403 response when attempting to toggle another user's task

**Checkpoint**: User Story 6 complete - users can mark tasks complete/incomplete

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T063 [P] Add comprehensive error handling for network failures in frontend/lib/api.ts
- [x] T064 [P] Add loading states to all async operations in frontend components
- [x] T065 Verify all API endpoints return correct status codes per contracts/openapi.yaml (401, 403, 404, 422)
- [x] T066 Verify data isolation - create 2 users, confirm neither can see/modify other's tasks
- [x] T067 Run quickstart.md verification checklist (all items must pass)
- [x] T068 Verify performance goals: task list < 2s, CRUD operations < 1s, auth flow < 30s
- [x] T069 [P] Add OpenAPI documentation route at /docs in FastAPI (auto-generated)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (Auth) should complete before US2-US6 (task operations need auth)
  - US2-US6 can proceed in any order after US1, but priority order is recommended
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (P1) | Phase 2 only | - |
| US2 (P2) | Phase 2, US1 (for auth) | - |
| US3 (P3) | Phase 2, US1, US2 (needs list to verify) | US4, US5, US6 |
| US4 (P4) | Phase 2, US1, US3 (needs task to update) | US5, US6 |
| US5 (P5) | Phase 2, US1, US3 (needs task to delete) | US4, US6 |
| US6 (P6) | Phase 2, US1, US3 (needs task to toggle) | US4, US5 |

### Within Each User Story

- Backend endpoints before frontend integration
- Core functionality before edge cases
- UI before optimistic updates

### Parallel Opportunities by Phase

**Phase 1 - Setup**:
```
Parallel Group A: T003, T004 (backend/frontend init)
Parallel Group B: T005, T006, T007, T008 (config files)
```

**Phase 2 - Foundation**:
```
Parallel Group A: T012, T013 (models)
Parallel Group B: T028, T029 (schemas)
```

**Phase 3-8 - Each user story has internal parallel opportunities marked with [P]**

---

## Parallel Execution Examples

### Foundation Phase Models

```bash
# Launch model creation in parallel:
Task: "Create User SQLModel in backend/app/models/user.py"
Task: "Create Task SQLModel in backend/app/models/task.py"
```

### Foundation Phase Schemas

```bash
# Launch schema creation in parallel:
Task: "Create User Pydantic schemas in backend/app/schemas/user.py"
Task: "Create Task Pydantic schemas in backend/app/schemas/task.py"
```

### Polish Phase

```bash
# Launch cross-cutting improvements in parallel:
Task: "Add comprehensive error handling in frontend/lib/api.ts"
Task: "Add loading states to all async operations"
Task: "Add OpenAPI documentation route at /docs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Registration/Login)
4. **STOP and VALIDATE**: Can users register, login, logout, and persist sessions?
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 (Auth) → Test independently → **MVP Complete!**
3. Add User Story 2 (View Tasks) → Test → Users can see their data
4. Add User Story 3 (Create Tasks) → Test → Users can add tasks
5. Add User Story 4 (Update Tasks) → Test → Users can edit
6. Add User Story 5 (Delete Tasks) → Test → Users can remove
7. Add User Story 6 (Toggle Complete) → Test → Full CRUD complete
8. Polish → Production ready

### Suggested MVP Scope

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (User Story 1)
- Users can register and login
- Session management works
- Foundation for all task operations in place

**Recommended Initial Release**: MVP + Phase 4 (US2) + Phase 5 (US3)
- Users can view and create tasks
- Demonstrates core value proposition

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 69 |
| **Phase 1 (Setup)** | 8 tasks |
| **Phase 2 (Foundation)** | 22 tasks |
| **Phase 3 (US1 - Auth)** | 7 tasks |
| **Phase 4 (US2 - View)** | 6 tasks |
| **Phase 5 (US3 - Create)** | 5 tasks |
| **Phase 6 (US4 - Update)** | 5 tasks |
| **Phase 7 (US5 - Delete)** | 5 tasks |
| **Phase 8 (US6 - Toggle)** | 4 tasks |
| **Phase 9 (Polish)** | 7 tasks |
| **Parallel Opportunities** | 14 tasks marked [P] |

### Format Validation

✅ All tasks use checkbox format: `- [ ]`
✅ All tasks have sequential IDs: T001-T069
✅ All parallelizable tasks marked with `[P]`
✅ All user story tasks labeled: `[US1]` through `[US6]`
✅ All tasks include file paths where applicable

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All endpoints follow contracts/openapi.yaml specification
- Data isolation is enforced at all levels per research.md triple-layer pattern
