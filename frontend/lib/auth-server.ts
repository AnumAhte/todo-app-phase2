/**
 * Better Auth server configuration
 * Server-side authentication setup with email/password and JWT support
 *
 * Phase II: Enhanced with session lifecycle hooks for auth event logging
 */

import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

// ============================================================================
// Auth Event Logging
// Logs security-relevant authentication events in structured JSON format
// ============================================================================

type AuthEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILURE"
  | "AUTH_TOKEN_REFRESH"
  | "AUTH_LOGOUT";

interface AuthEventData {
  event: AuthEventType;
  timestamp: string;
  userId?: string;
  email?: string;
  sessionId?: string;
  message?: string;
}

function logAuthEvent(data: AuthEventData): void {
  console.log(JSON.stringify(data));
}

const secret = process.env.BETTER_AUTH_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Determine if we're in production environment
const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  secret,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
  ],
  // Session configuration for token lifetimes
  session: {
    expiresIn: 60 * 15, // Access token: 15 minutes (in seconds)
    updateAge: 60 * 5, // Refresh access token 5 minutes before expiry
    freshAge: 60 * 5, // Consider session "fresh" for 5 minutes
    cookieCache: {
      enabled: true,
      maxAge: 60 * 15, // Cache for 15 minutes
    },
  },
  // Cookie configuration for secure HTTP-only storage
  advanced: {
    useSecureCookies: isProduction, // Secure flag only in production (requires HTTPS)
    cookiePrefix: "todo_", // Prefix for cookie names
    defaultCookieAttributes: {
      httpOnly: true, // Prevent JavaScript access (XSS protection)
      sameSite: "lax", // CSRF protection while allowing normal navigation
      path: "/",
      secure: isProduction, // Only send over HTTPS in production
    },
  },
  plugins: [
    jwt({
      jwt: {
        expirationTime: "15m", // Short-lived access tokens (15 minutes)
      },
    }),
  ],
  // Session lifecycle hooks for auth event logging
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // Log successful login (new session created)
          logAuthEvent({
            event: "AUTH_LOGIN_SUCCESS",
            timestamp: new Date().toISOString(),
            userId: session.userId,
            sessionId: session.id,
            message: "User logged in successfully",
          });
        },
      },
      update: {
        after: async (session) => {
          // Log token refresh (session updated/extended)
          logAuthEvent({
            event: "AUTH_TOKEN_REFRESH",
            timestamp: new Date().toISOString(),
            userId: session.userId,
            sessionId: session.id,
            message: "Session token refreshed",
          });
        },
      },
      delete: {
        before: async (session) => {
          // Log logout (session being deleted)
          logAuthEvent({
            event: "AUTH_LOGOUT",
            timestamp: new Date().toISOString(),
            userId: session.userId,
            sessionId: session.id,
            message: "User logged out",
          });
        },
      },
    },
  },
});
