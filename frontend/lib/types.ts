/**
 * Type definitions for the Todo application
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Backend uses snake_case, frontend uses camelCase
// We keep camelCase in frontend and convert at API boundary
export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
}

export interface TaskUpdate {
  title?: string;
  is_completed?: boolean;
}

export interface TaskListResponse {
  tasks: Task[];
  count: number;
}

export interface AuthSession {
  user: User;
  token: string;
}
