"use client";

/**
 * Tasks Page
 * Main page for managing user tasks with full CRUD operations
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/types";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from "@/lib/api";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load tasks from the API
   */
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTasks();
      setTasks(response.tasks);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load tasks";
      setError(errorMessage);

      // Redirect to login if authentication fails
      if (
        errorMessage.includes("authenticated") ||
        errorMessage.includes("Authentication failed")
      ) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /**
   * Create a new task
   */
  const handleCreateTask = async (title: string) => {
    try {
      const newTask = await createTask({ title });

      // Optimistic update: add to local state immediately
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create task";
      setError(errorMessage);

      // Redirect to login if authentication fails
      if (
        errorMessage.includes("authenticated") ||
        errorMessage.includes("Authentication failed")
      ) {
        router.push("/login");
      }
      throw err; // Re-throw so TaskForm can handle it
    }
  };

  /**
   * Toggle task completion status
   */
  const handleToggleTask = async (taskId: string) => {
    // Optimistic update: toggle in local state immediately
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, isCompleted: !task.isCompleted }
          : task
      )
    );

    try {
      const updatedTask = await toggleTaskComplete(taskId);

      // Update with server response
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to toggle task";
      setError(errorMessage);

      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, isCompleted: !task.isCompleted }
            : task
        )
      );

      // Redirect to login if authentication fails
      if (
        errorMessage.includes("authenticated") ||
        errorMessage.includes("Authentication failed")
      ) {
        router.push("/login");
      }
    }
  };

  /**
   * Edit task title
   */
  const handleEditTask = async (taskId: string, newTitle: string) => {
    // Store original task for rollback
    const originalTask = tasks.find((task) => task.id === taskId);

    // Optimistic update: update in local state immediately
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, title: newTitle } : task
      )
    );

    try {
      const updatedTask = await updateTask(taskId, { title: newTitle });

      // Update with server response
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update task";
      setError(errorMessage);

      // Revert optimistic update on error
      if (originalTask) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? originalTask : task))
        );
      }

      // Redirect to login if authentication fails
      if (
        errorMessage.includes("authenticated") ||
        errorMessage.includes("Authentication failed")
      ) {
        router.push("/login");
      }
    }
  };

  /**
   * Delete a task
   */
  const handleDeleteTask = async (taskId: string) => {
    // Store original tasks for rollback
    const originalTasks = tasks;

    // Optimistic update: remove from local state immediately
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

    try {
      await deleteTask(taskId);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete task";
      setError(errorMessage);

      // Revert optimistic update on error
      setTasks(originalTasks);

      // Redirect to login if authentication fails
      if (
        errorMessage.includes("authenticated") ||
        errorMessage.includes("Authentication failed")
      ) {
        router.push("/login");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
        <p className="text-gray-600">
          Manage your tasks and stay organized
          {tasks.length > 0 && (
            <span className="ml-2 text-sm">
              ({tasks.filter((t) => !t.isCompleted).length} active,{" "}
              {tasks.filter((t) => t.isCompleted).length} completed)
            </span>
          )}
        </p>
      </header>

      {/* Global error message */}
      {error && (
        <div
          className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          role="alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 flex-shrink-0 mt-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Task creation form */}
      <div className="mb-8">
        <TaskForm onSubmit={handleCreateTask} />
      </div>

      {/* Task list */}
      <TaskList
        tasks={tasks}
        onToggle={handleToggleTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        isLoading={isLoading}
      />
    </div>
  );
}
