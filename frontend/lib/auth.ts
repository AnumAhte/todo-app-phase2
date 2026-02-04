/**
 * Better Auth client configuration
 * Provides authentication functionality using Better Auth with email/password and JWT
 *
 * Phase II: Configured for HTTP-only cookie-based authentication
 */

"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

/**
 * Better Auth client instance configured with:
 * - Email/password authentication
 * - JWT plugin for token management
 * - HTTP-only cookie storage (configured server-side)
 * - Automatic session refresh via cookies
 *
 * Uses same-origin API routes at /api/auth/[...all]
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  // Fetch configuration for cookie handling
  fetchOptions: {
    credentials: "include", // Include cookies in all requests
  },
  plugins: [jwtClient()],
});

/**
 * Export types from Better Auth for use throughout the application
 */
export type Session = typeof authClient.$Infer.Session;
