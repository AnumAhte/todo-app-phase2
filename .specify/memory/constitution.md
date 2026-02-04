<!--
============================================================================
SYNC IMPACT REPORT
============================================================================
Version Change: 0.0.0 → 1.0.0 (MAJOR - initial ratification)

Modified Principles: N/A (new constitution)

Added Sections:
  - Core Principles (8 principles)
  - Security Constitution
  - Development Workflow
  - Governance

Removed Sections: N/A

Templates Status:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - Requirements section supports security/auth requirements
  ✅ tasks-template.md - Foundational phase supports security infrastructure
  ✅ phr-template.prompt.md - No constitution-specific changes needed

Follow-up TODOs: None
============================================================================
-->

# Multi-User Todo Web Application Constitution

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

Every feature MUST follow the complete spec-driven workflow without exception:

1. **Constitution** - Establishes project principles and constraints
2. **Specification** - Defines requirements, user stories, acceptance criteria
3. **Plan** - Documents technical approach, architecture, dependencies
4. **Task Breakdown** - Decomposes plan into actionable, testable tasks
5. **Claude Code Generation** - Implementation via AI-assisted coding only

**Rationale**: This ensures traceability, reproducibility, and quality gates at every phase. No code exists without a traceable path to requirements.

### II. Security-First Design (NON-NEGOTIABLE)

All system design decisions MUST prioritize security:

- **Zero Trust Between Services**: Backend MUST never trust frontend without JWT verification
- **User Isolation**: All data access MUST be user-scoped and verified
- **Stateless Authentication**: Authentication MUST be stateless using JWT tokens
- **Environment-Based Secrets**: All secrets (BETTER_AUTH_SECRET, JWT_SECRET, DATABASE_URL) MUST be stored in environment variables, never hardcoded

**Rationale**: Security vulnerabilities in authentication and data access are the highest-risk attack vectors. Defense in depth prevents cross-user data leakage.

### III. JWT Authentication Protocol (NON-NEGOTIABLE)

All API endpoints MUST enforce JWT-based authentication:

- All endpoints require valid JWT token in `Authorization: Bearer <token>` header
- JWT MUST be verified in FastAPI middleware before any request processing
- User ID from decoded token MUST match the user_id in the request URL/context
- All database queries MUST be filtered by authenticated user ID only
- **401 Unauthorized** on missing or invalid token
- **403 Forbidden** on user ID mismatch (token user ≠ requested resource owner)
- Token expiry MUST be enforced; expired tokens are rejected

**Rationale**: Consistent authentication prevents authorization bypass vulnerabilities and ensures audit trails.

### IV. Clean Architecture

System design MUST maintain clear separation of concerns:

- **Frontend (Next.js 16+ App Router)**: UI/UX, client-side state, API integration
- **Backend (Python FastAPI)**: Business logic, API endpoints, JWT verification
- **Database (Neon PostgreSQL)**: Data persistence, schema integrity, user isolation
- **ORM (SQLModel)**: Typed models, query safety, migration management

Each layer has explicit responsibilities. Cross-layer coupling MUST be minimized.

**Rationale**: Separation enables independent testing, deployment, and evolution of each layer.

### V. API Contract Compliance

All REST APIs MUST follow HTTP semantics and status codes:

- **200 OK**: Successful GET/PUT/PATCH
- **201 Created**: Successful POST creating a resource
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid request body/parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource does not exist
- **422 Unprocessable Entity**: Validation failure
- **500 Internal Server Error**: Unexpected server failure

All API behavior MUST be traceable to specifications.

**Rationale**: Consistent API semantics enable reliable frontend integration and debugging.

### VI. Deterministic Builds

All builds MUST be deterministic and reproducible:

- Lock files (package-lock.json, requirements.txt with pinned versions) MUST be committed
- Environment configuration MUST be documented in `.env.example` files
- Database schema MUST be version-controlled via migrations
- All dependencies MUST have explicit versions

**Rationale**: Reproducibility ensures consistent behavior across development, testing, and production environments.

### VII. Typed Data Models

All data models MUST be explicitly typed:

- **Backend**: SQLModel for database entities with Python type hints
- **Frontend**: TypeScript interfaces for API responses and component props
- **API**: Pydantic schemas for request/response validation

**Rationale**: Type safety catches errors at compile time and improves code maintainability.

### VIII. Production Readiness

The system MUST be designed for production deployment:

- Clean modular project structure (frontend/, backend/, specs/)
- Clear API contracts documented via OpenAPI/Swagger
- Environment-based configuration for all deployment targets
- Architecture supports future AI-agent and Kubernetes phases

**Rationale**: Production-grade practices from the start prevent technical debt accumulation.

## Security Constitution

This section contains non-negotiable security requirements that override all other considerations.

### Authentication Requirements

| Requirement | Implementation | Enforcement |
|-------------|----------------|-------------|
| Valid JWT required | All API endpoints | FastAPI middleware |
| Token signature verification | HMAC-SHA256 with shared secret | JWT library |
| Token expiry validation | exp claim checked | JWT library |
| User ID matching | Token user_id = URL user_id | Route handlers |
| Query filtering | WHERE user_id = authenticated_user | SQLModel queries |

### Response Codes

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| No token provided | 401 | `{"detail": "Not authenticated"}` |
| Invalid/expired token | 401 | `{"detail": "Invalid token"}` |
| Token user ≠ resource owner | 403 | `{"detail": "Forbidden"}` |
| Resource not found | 404 | `{"detail": "Not found"}` |

### Prohibited Actions

- ❌ Storing tokens in localStorage (XSS vulnerability)
- ❌ Hardcoding secrets in source code
- ❌ Querying data without user_id filter
- ❌ Trusting client-provided user IDs without JWT verification
- ❌ Logging sensitive token contents

## Development Workflow

### Phase Execution (NON-NEGOTIABLE)

1. **No code outside Claude Code output** - All implementation via AI-assisted generation
2. **No skipping phases** - Constitution → Spec → Plan → Tasks → Implement
3. **No unauthenticated access** - Every endpoint enforces JWT
4. **No cross-user data leakage** - Every query filtered by user_id

### Quality Gates

Each phase MUST pass quality gates before proceeding:

- **Specification**: All requirements have acceptance criteria
- **Plan**: Architecture decisions documented, dependencies identified
- **Tasks**: Each task is testable, traceable to spec
- **Implementation**: All acceptance criteria verified

### Success Criteria

- [ ] Multi-user Todo application works end-to-end
- [ ] Authentication fully enforced on all endpoints
- [ ] API behavior reproducible from specifications
- [ ] Database persistence verified in Neon PostgreSQL
- [ ] Frontend and backend independently verifiable
- [ ] Phase-wise evolution without breaking prior features

## Governance

### Amendment Process

1. Proposed amendments MUST be documented with rationale
2. Amendments require explicit approval before implementation
3. All amendments MUST include migration plan for existing features
4. Version number MUST be incremented according to semantic versioning

### Versioning Policy

- **MAJOR**: Backward-incompatible principle changes or removals
- **MINOR**: New principles added or existing guidance materially expanded
- **PATCH**: Clarifications, wording improvements, non-semantic changes

### Compliance Verification

- All PRs/reviews MUST verify compliance with this constitution
- Security principles (II, III) are non-negotiable and cannot be waived
- Complexity additions MUST be justified in plan.md
- Constitution supersedes all other development practices

### Runtime Guidance

For day-to-day development guidance, refer to:
- `CLAUDE.md` for agent delegation and technology stack
- `specs/<feature>/plan.md` for feature-specific decisions
- `history/adr/` for architectural decision records

**Version**: 1.0.0 | **Ratified**: 2026-01-15 | **Last Amended**: 2026-01-15
