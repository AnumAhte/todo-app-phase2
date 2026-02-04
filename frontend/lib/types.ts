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

export interface Task {
  id: string;
  userId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreate {
  title: string;
}

export interface TaskUpdate {
  title?: string;
  isCompleted?: boolean;
}

export interface TaskListResponse {
  tasks: Task[];
  count: number;
}

export interface AuthSession {
  user: User;
  token: string;
}
