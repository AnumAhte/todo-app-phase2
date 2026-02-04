/**
 * Auth client helpers and hooks
 * Provides convenient wrappers for authentication operations
 */

"use client";

import { authClient } from "./auth";

/**
 * Create an auth client instance
 * @returns The Better Auth client
 */
export function createAuthClient() {
  return authClient;
}

/**
 * Hook to access the current session
 * @returns Session data and loading state
 */
export function useSession() {
  return authClient.useSession();
}

/**
 * Sign in with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with sign-in result
 */
export async function signIn(email: string, password: string) {
  return authClient.signIn.email({
    email,
    password,
  });
}

/**
 * Sign up with email, password, and name
 * @param email - User's email address
 * @param password - User's password
 * @param name - User's display name
 * @returns Promise with sign-up result
 */
export async function signUp(email: string, password: string, name: string) {
  return authClient.signUp.email({
    email,
    password,
    name,
  });
}

/**
 * Sign out the current user
 * Clears all auth cookies via Better Auth and optionally redirects to login
 *
 * Phase II: Enhanced to ensure complete session cleanup
 *
 * @param options - Optional configuration
 * @param options.redirect - Whether to redirect to login page (default: true)
 * @returns Promise with sign-out result
 */
export async function signOut(options?: { redirect?: boolean }) {
  const { redirect = true } = options || {};

  try {
    // Better Auth signOut clears all session cookies
    const result = await authClient.signOut({
      fetchOptions: {
        credentials: "include", // Ensure cookies are sent with the request
      },
    });

    if (redirect && typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return result;
  } catch (error) {
    // Even if signOut fails, redirect to login
    if (redirect && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw error;
  }
}
