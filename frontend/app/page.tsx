/**
 * Landing page
 * Redirects authenticated users to /tasks, unauthenticated users to /login
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth-server";

export default async function HomePage() {
  // Check authentication status using server-side auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect based on auth status
  if (session?.user) {
    redirect("/tasks");
  } else {
    redirect("/login");
  }
}
