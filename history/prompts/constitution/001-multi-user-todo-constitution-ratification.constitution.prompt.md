---
id: 001
title: Multi-User Todo Constitution Ratification
stage: constitution
date: 2026-01-15
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: main
user: CBM
command: /sp.constitution
labels: ["constitution", "security", "jwt", "spec-driven", "governance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - null
---

## Prompt

Project: Multi-User Full-Stack Todo Web Application (Spec-Driven, AI-Assisted)

Core Principles:

Deterministic, reproducible builds

Security-first design (JWT, user isolation, zero trust between services)

Clean architecture and separation of concerns

Production-grade API and database practices

Key Standards:

Every feature must have:

Constitution

Specification

Plan

Task breakdown

Claude Code generation

All API behavior must be traceable to specs

Authentication must be stateless using JWT

All data access must be user-scoped and verified

Environment-based secrets (BETTER_AUTH_SECRET)

REST must follow HTTP semantics and status codes

Non-Negotiable Rules:

No code outside Claude Code output

No skipping phases

No unauthenticated access to data

No cross-user data leakage

Backend must never trust frontend without JWT verification

Security Constitution:

All endpoints require valid JWT

JWT verified in FastAPI middleware

User ID from token must match URL user_id

Queries filtered by authenticated user only

401 on missing/invalid token

403 on user mismatch

Token expiry enforced

Quality Bar:

Clean modular project structure

Typed models (SQLModel)

Clear API contracts

Ready for later AI-agent and Kubernetes phases

Success Criteria:

Multi-user Todo works end-to-end

Auth fully enforced

API reproducible from specs

Database persistence in Neon

Frontend and backend independently verifiable

Phase-wise evolution without breaking prior features

## Response snapshot

Created project constitution v1.0.0 for Multi-User Todo Web Application with 8 core principles:

1. **Spec-Driven Development** - Mandatory workflow: Constitution → Spec → Plan → Tasks → Implementation
2. **Security-First Design** - Zero trust, user isolation, environment-based secrets
3. **JWT Authentication Protocol** - Token verification, user ID matching, proper HTTP status codes
4. **Clean Architecture** - Separation: Frontend (Next.js) / Backend (FastAPI) / Database (Neon PostgreSQL)
5. **API Contract Compliance** - RESTful semantics with proper HTTP status codes
6. **Deterministic Builds** - Lock files, version pinning, reproducibility
7. **Typed Data Models** - SQLModel, TypeScript, Pydantic schemas
8. **Production Readiness** - Modular structure ready for AI-agent and Kubernetes phases

Added Security Constitution section with authentication requirements table, response codes, and prohibited actions list.

Added Development Workflow section with phase execution rules, quality gates, and success criteria checklist.

Added Governance section with amendment process, versioning policy, and compliance verification requirements.

## Outcome

- ✅ Impact: Established foundational governance for multi-user todo web application project
- 🧪 Tests: N/A - constitution document (governance artifact)
- 📁 Files: .specify/memory/constitution.md (created/updated)
- 🔁 Next prompts: /sp.specify for first feature spec, then /sp.plan and /sp.tasks
- 🧠 Reflection: User provided comprehensive input covering all aspects; constitution aligns with security-first, spec-driven methodology

## Evaluation notes (flywheel)

- Failure modes observed: None - user input was comprehensive
- Graders run and results (PASS/FAIL): Manual review PASS - all placeholders filled, principles declarative and testable
- Prompt variant (if applicable): Standard /sp.constitution invocation with detailed user requirements
- Next experiment (smallest change to try): N/A - constitution complete as specified
