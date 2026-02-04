import { ReactNode } from "react";

/**
 * Auth layout for public authentication pages (login, signup)
 * Provides a simple centered layout without authentication checks
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
}
