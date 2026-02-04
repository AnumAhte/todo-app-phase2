"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { authClient } from "@/lib/auth";

/**
 * Session expired banner component
 * Displays when user is redirected due to session expiration
 */
function SessionExpiredBanner() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";
  const message = searchParams.get("message") || "Your session has expired. Please sign in again.";

  if (!isExpired) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Login page
 * Uses Better Auth for email/password authentication
 *
 * Phase II: Enhanced with session expired message display
 */
export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Invalid email or password");
      }

      // Successful login - redirect to tasks page
      router.push("/tasks");
    } catch (error) {
      // Re-throw to let AuthForm handle the error display
      throw error instanceof Error
        ? error
        : new Error("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <SessionExpiredBanner />
        </Suspense>
        <AuthForm mode="login" onSubmit={handleLogin} />
      </div>
    </div>
  );
}
