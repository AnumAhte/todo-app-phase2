# Implementation Plan: Authenticated Full-Stack Core (Phase I)

**Branch**: `001-auth-fullstack-core` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-fullstack-core/spec.md`

## Summary

Transform a console Todo application into a modern multi-user web application with:
- JWT-based authentication using Better Auth (frontend) and FastAPI middleware (backend)
- RESTful API endpoints for task CRUD operations with strict user-scoped data isolation
- Persistent storage in Neon Serverless PostgreSQL with SQLModel ORM
- Responsive frontend using Next.js 16+ App Router

All 5 core features (Add, View, Update, Delete, Mark Complete) with 100% authentication enforcement and zero cross-user data leakage.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x with Node.js 20+
- Backend: Python 3.11+

**Primary Dependencies**:
- Frontend: Next.js 16+ (App Router), Better Auth, React 18+
- Backend: FastAPI, SQLModel, PyJWT, python-jose

**Storage**: Neon Serverless PostgreSQL with connection pooling

**Testing**:
- Frontend: Jest, React Testing Library
- Backend: pytest, httpx (for API testing)

**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

**Project Type**: Web application (frontend + backend separated)

**Performance Goals**:
- Task list load: < 2 seconds for 100 tasks
- CRUD operations: < 1 second response time
- Auth flow: < 30 seconds end-to-end

**Constraints**:
- All API calls require valid JWT
- User ID in token must match resource owner
- No cross-user data access

**Scale/Scope**:
- Initial: Single-user testing, scales to multi-user
- Database: Neon Serverless (auto-scaling)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Evidence |
|-----------|-------------|--------|----------|
| I. Spec-Driven Development | Complete spec before planning | ✅ PASS | spec.md created with 22 FRs, 10 SCs |
| II. Security-First Design | JWT verification, user isolation | ✅ PASS | FR-011 to FR-013 mandate data isolation |
| III. JWT Authentication Protocol | Token verification in middleware | ✅ PASS | FR-003, FR-017 require valid JWT |
| IV. Clean Architecture | Separated frontend/backend | ✅ PASS | Project structure uses web app pattern |
| V. API Contract Compliance | RESTful HTTP semantics | ✅ PASS | FR-017 to FR-022 define status codes |
| VI. Deterministic Builds | Lock files, version pinning | ✅ PASS | Will commit package-lock.json, requirements.txt |
| VII. Typed Data Models | SQLModel, TypeScript, Pydantic | ✅ PASS | Tech stack includes all typed frameworks |
| VIII. Production Readiness | Modular structure, OpenAPI docs | ✅ PASS | FastAPI auto-generates OpenAPI |

**Gate Result**: PASS - All 8 constitution principles satisfied. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-fullstack-core/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── openapi.yaml     # REST API contract
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── database.py          # Neon PostgreSQL connection
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── middleware.py    # JWT verification middleware
│   │   └── dependencies.py  # Auth dependencies for routes
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User SQLModel
│   │   └── task.py          # Task SQLModel
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py          # User Pydantic schemas
│   │   └── task.py          # Task Pydantic schemas
│   └── routers/
│       ├── __init__.py
│       └── tasks.py         # Task CRUD endpoints
├── tests/
│   ├── conftest.py          # Pytest fixtures
│   ├── test_auth.py         # Auth middleware tests
│   └── test_tasks.py        # Task endpoint tests
├── alembic/                 # Database migrations
│   └── versions/
├── requirements.txt         # Pinned dependencies
├── alembic.ini
└── .env.example

frontend/
├── app/
│   ├── layout.tsx           # Root layout with auth provider
│   ├── page.tsx             # Landing/redirect page
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx     # Login page
│   │   └── signup/
│   │       └── page.tsx     # Signup page
│   ├── (dashboard)/
│   │   ├── layout.tsx       # Protected layout
│   │   └── tasks/
│   │       └── page.tsx     # Task list page
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts # Better Auth API routes
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── TaskList.tsx         # Task list component
│   ├── TaskItem.tsx         # Individual task component
│   ├── TaskForm.tsx         # Create/edit task form
│   └── AuthForm.tsx         # Login/signup form
├── lib/
│   ├── auth.ts              # Better Auth client configuration
│   ├── api.ts               # API client with JWT injection
│   └── types.ts             # TypeScript interfaces
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.js
└── .env.local.example
```

**Structure Decision**: Web application pattern selected (Option 2) because the feature requires:
1. Separate frontend (Next.js) and backend (FastAPI) as specified in CLAUDE.md
2. JWT-based authentication with Better Auth on frontend
3. Independent deployment and testing of each layer (SC-010)

## Complexity Tracking

No constitution violations requiring justification. Architecture follows prescribed patterns.

## Phase 0: Research Summary

See [research.md](./research.md) for detailed findings.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) - Entity definitions and relationships
- [contracts/openapi.yaml](./contracts/openapi.yaml) - REST API specification
- [quickstart.md](./quickstart.md) - Development setup guide
