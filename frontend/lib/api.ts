/**
 * Typed API client with JWT token injection and automatic token refresh
 * Handles all communication with the FastAPI backend
 *
 * Phase II: Enhanced with:
 * - Automatic 401 handling with token refresh
 * - Mutex pattern to prevent concurrent refresh requests
 * - Exponential backoff for network failures
 * - Session expiration redirect
 */

import { authClient } from "./auth";
import type { Task, TaskCreate, TaskUpdate, TaskListResponse } from "./types";

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// Token Refresh Mutex Pattern
// Prevents multiple concurrent refresh attempts when multiple requests fail
// ============================================================================

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the refresh token
 * Uses mutex pattern to prevent concurrent refresh requests
 *
 * @returns Promise<boolean> - true if refresh succeeded, false otherwise
 */
async function attemptRefresh(): Promise<boolean> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Acquire the refresh lock
  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      // Use Better Auth's getSession with update flag to force a refresh
      const session = await authClient.getSession({ update: true });

      if (session?.data?.session) {
        // Refresh successful
        return true;
      }

      // No valid session after refresh attempt
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    } finally {
      // Release the refresh lock
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ============================================================================
// Session Expiration Handling
// ============================================================================

/**
 * Custom error class for session expiration
 * Allows callers to distinguish between auth errors and other errors
 */
export class SessionExpiredError extends Error {
  constructor(message: string = "Session expired. Please sign in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * Handle session expiration by clearing auth state and redirecting
 * @param message - Optional message to display on login page
 */
function handleSessionExpired(message?: string): never {
  // Redirect to login with session expired message
  const loginUrl = message
    ? `/login?expired=true&message=${encodeURIComponent(message)}`
    : "/login?expired=true";

  if (typeof window !== "undefined") {
    window.location.href = loginUrl;
  }

  throw new SessionExpiredError(message);
}

// ============================================================================
// Exponential Backoff for Network Errors
// ============================================================================

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

// ============================================================================
// Core Fetch Function with Auth
// ============================================================================

/**
 * Fetch wrapper that automatically includes JWT token from auth session
 * Handles 401 errors with automatic token refresh and request retry
 *
 * @param endpoint - API endpoint path (e.g., "/tasks")
 * @param options - Fetch options
 * @param retryCount - Current retry attempt (for internal use)
 * @returns Promise with parsed JSON response
 * @throws Error if authentication fails or request fails
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<T> {
  // Get JWT token from Better Auth's JWT plugin
  const tokenResult = await authClient.token();

  if (!tokenResult?.data?.token) {
    // No token available - session may have expired
    handleSessionExpired("Not authenticated. Please sign in.");
  }

  const token = tokenResult.data.token;

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies for session management
    });
  } catch (networkError) {
    // Handle network errors with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = getBackoffDelay(retryCount);
      console.warn(
        `Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      await sleep(delay);
      return fetchWithAuth<T>(endpoint, options, retryCount + 1);
    }

    throw new Error(
      "Unable to connect to the server. Please check your internet connection and try again."
    );
  }

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401) {
    // Only attempt refresh once per request chain
    if (retryCount === 0) {
      const refreshed = await attemptRefresh();

      if (refreshed) {
        // Retry the original request with new token
        return fetchWithAuth<T>(endpoint, options, 1);
      }
    }

    // Refresh failed or already retried - session is truly expired
    handleSessionExpired("Session expired. Please sign in again.");
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new Error("You do not have permission to access this resource.");
  }

  // Handle 404 Not Found
  if (response.status === 404) {
    throw new Error("The requested resource was not found.");
  }

  // Handle validation errors (422)
  if (response.status === 422) {
    const errorData = await response.json();
    const validationErrors = errorData.detail;
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      throw new Error(validationErrors[0].msg || "Validation error");
    }
    throw new Error("Invalid input. Please check your data and try again.");
  }

  // Handle other HTTP errors
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorJson.message || errorMessage;
    } catch {
      // If error is not JSON, use the text
      if (errorText) {
        errorMessage = errorText;
      }
    }

    throw new Error(errorMessage);
  }

  // Handle 204 No Content (for DELETE)
  if (response.status === 204) {
    return undefined as T;
  }

  // Parse and return JSON response
  return response.json();
}

// ============================================================================
// User Session Helpers
// ============================================================================

/**
 * Get user ID from the current session
 * @returns User ID string
 */
async function getUserId(): Promise<string> {
  const session = await authClient.getSession();
  if (!session?.data?.user?.id) {
    handleSessionExpired("Not authenticated. Please sign in.");
  }
  return session.data.user.id;
}

// ============================================================================
// Task API Functions
// ============================================================================

/**
 * Get all tasks for the authenticated user
 * @returns Promise with task list response
 */
export async function getTasks(): Promise<TaskListResponse> {
  const userId = await getUserId();
  return fetchWithAuth<TaskListResponse>(`/api/${userId}/tasks`);
}

/**
 * Create a new task
 * @param task - Task data to create
 * @returns Promise with created task
 */
export async function createTask(task: TaskCreate): Promise<Task> {
  const userId = await getUserId();
  return fetchWithAuth<Task>(`/api/${userId}/tasks`, {
    method: "POST",
    body: JSON.stringify(task),
  });
}

/**
 * Update an existing task
 * @param taskId - ID of task to update
 * @param updates - Fields to update
 * @returns Promise with updated task
 */
export async function updateTask(
  taskId: string,
  updates: TaskUpdate
): Promise<Task> {
  const userId = await getUserId();
  return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a task
 * @param taskId - ID of task to delete
 * @returns Promise that resolves when task is deleted
 */
export async function deleteTask(taskId: string): Promise<void> {
  const userId = await getUserId();
  await fetchWithAuth<void>(`/api/${userId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

/**
 * Toggle task completion status
 * @param taskId - ID of task to toggle
 * @returns Promise with updated task
 */
export async function toggleTaskComplete(taskId: string): Promise<Task> {
  const userId = await getUserId();
  return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}/complete`, {
    method: "PATCH",
  });
}
