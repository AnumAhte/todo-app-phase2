/**
 * Better Auth API routes
 * Handles all authentication-related API endpoints
 */

import { auth } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
