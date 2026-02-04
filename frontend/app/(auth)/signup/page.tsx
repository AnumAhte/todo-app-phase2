"use client";

import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { authClient } from "@/lib/auth";

/**
 * Signup page
 * Uses Better Auth for user registration with email/password
 */
export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (data: {
    email: string;
    password: string;
    name?: string;
  }) => {
    if (!data.name) {
      throw new Error("Name is required");
    }

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        // Handle specific error cases
        const errorMessage = result.error.message;
        if (errorMessage?.toLowerCase().includes("already exists")) {
          throw new Error("An account with this email already exists");
        }
        throw new Error(errorMessage || "Signup failed");
      }

      // Successful signup - Better Auth automatically signs in the user
      // Redirect to tasks page
      router.push("/tasks");
    } catch (error) {
      // Re-throw to let AuthForm handle the error display
      throw error instanceof Error
        ? error
        : new Error("Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm mode="signup" onSubmit={handleSignup} />
    </div>
  );
}
