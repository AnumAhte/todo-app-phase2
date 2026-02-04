# Data Model: Session & Security Enhancements

**Feature**: 002-session-security-enhancements
**Date**: 2026-01-28
**Status**: Complete

## Overview

Phase II does not introduce new database tables. All token management is handled through:
1. HTTP-only cookies (browser storage)
2. Better Auth's built-in session management
3. JWT claims (stateless verification)

This document defines the logical token entities and their attributes.

## Token Entities

### Access Token (JWT)

**Purpose**: Short-lived credential for API authentication

**Storage**: HTTP-only cookie named `todo_session_token`

**Attributes**:

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | UUID | User ID (subject) |
| `iat` | timestamp | Issued at time |
| `exp` | timestamp | Expiration time (15 min from iat) |
| `iss` | string | Issuer (Better Auth) |

**Cookie Configuration**:

| Attribute | Value |
|-----------|-------|
| `name` | `todo_session_token` |
| `httpOnly` | `true` |
| `secure` | `true` (production) |
| `sameSite` | `Lax` |
| `path` | `/` |
| `maxAge` | `900` (15 minutes) |

**Validation Rules**:
- Signature verified using JWKS public key from Better Auth
- `exp` claim checked with 30-second leeway for clock skew
- `sub` claim must be valid UUID
- Algorithm must be EdDSA (as used by Better Auth)

---

### Refresh Token

**Purpose**: Long-lived credential for obtaining new access tokens

**Storage**: HTTP-only cookie managed by Better Auth

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Better Auth session identifier |
| `userId` | UUID | Associated user ID |
| `expiresAt` | timestamp | Expiration (7 days from creation) |

**Cookie Configuration**:

| Attribute | Value |
|-----------|-------|
| `name` | `todo_session_data` |
| `httpOnly` | `true` |
| `secure` | `true` (production) |
| `sameSite` | `Lax` |
| `path` | `/api/auth` |
| `maxAge` | `604800` (7 days) |

**Validation Rules**:
- Validated by Better Auth server-side
- Session must exist and not be expired
- User account must be active

---

### User Session (Logical Entity)

**Purpose**: Represents an authenticated user's session state

**Lifecycle States**:

```
┌──────────┐     ┌────────┐     ┌─────────┐     ┌─────────┐
│  Created │────>│ Active │────>│ Expired │────>│ Cleared │
└──────────┘     └────────┘     └─────────┘     └─────────┘
      │               │               │
      │               │               │
      │               v               v
      │         ┌──────────┐    ┌──────────┐
      │         │ Refreshed│    │  Logged  │
      │         │          │    │   Out    │
      │         └──────────┘    └──────────┘
      │               │
      └───────────────┘
```

**State Transitions**:

| From | To | Trigger |
|------|----|---------|
| Created | Active | Login successful |
| Active | Refreshed | Access token expired, refresh valid |
| Active | Expired | Both tokens expired |
| Active | Logged Out | User logout action |
| Refreshed | Active | New access token issued |
| Expired | Cleared | Redirect to login |
| Logged Out | Cleared | Cookies deleted |

---

## Auth Event Log Entry (Logical Entity)

**Purpose**: Audit trail for security-relevant authentication events

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 string | Event occurrence time |
| `event_type` | enum | Type of auth event |
| `user_id` | UUID or null | User ID if available |
| `ip_address` | string | Client IP (masked last octet for privacy) |
| `user_agent` | string | Browser/client identifier (truncated to 100 chars) |
| `details` | object | Event-specific additional data |

**Event Types**:

| Event Type | Description | Required Details |
|------------|-------------|------------------|
| `AUTH_LOGIN_SUCCESS` | User logged in | - |
| `AUTH_LOGIN_FAILURE` | Login failed | `reason`: string |
| `AUTH_TOKEN_REFRESH` | Access token refreshed | - |
| `AUTH_TOKEN_REFRESH_FAILURE` | Refresh failed | `reason`: string |
| `AUTH_LOGOUT` | User logged out | - |
| `AUTH_DENIED` | Authorization denied (403) | `resource`: string |

**Example Log Entries**:

```json
{
  "timestamp": "2026-01-28T15:30:00.000Z",
  "event_type": "AUTH_LOGIN_SUCCESS",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "ip_address": "192.168.1.xxx",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "details": {}
}

{
  "timestamp": "2026-01-28T15:45:00.000Z",
  "event_type": "AUTH_LOGIN_FAILURE",
  "user_id": null,
  "ip_address": "192.168.1.xxx",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "reason": "invalid_credentials",
    "email_hash": "a1b2c3..."
  }
}
```

---

## Relationships

```
┌─────────────────┐
│      User       │
│   (from Phase I)│
└────────┬────────┘
         │
         │ 1:N (one user can have multiple sessions)
         │
         v
┌─────────────────┐
│  User Session   │
│   (logical)     │
└────────┬────────┘
         │
         │ 1:1 (each session has one token pair)
         │
         v
┌─────────────────┐     ┌─────────────────┐
│  Access Token   │────>│  Refresh Token  │
│    (cookie)     │     │    (cookie)     │
└─────────────────┘     └─────────────────┘
```

---

## No Database Schema Changes

Phase II does not require database migrations because:

1. **Tokens are stateless**: JWTs contain all necessary claims
2. **Session state in cookies**: Managed by Better Auth
3. **Logs go to stdout**: Not persisted in database
4. **User/Task tables unchanged**: From Phase I

If future requirements need token revocation lists or session persistence, a `sessions` table could be added in a later phase.
