"use client";

/**
 * TaskForm Component
 * Form for creating new tasks with validation and loading states
 */

import { useState, FormEvent } from "react";

interface TaskFormProps {
  onSubmit: (title: string) => Promise<void>;
}

export default function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title cannot be empty");
      return;
    }

    if (trimmedTitle.length > 200) {
      setError("Task title is too long (max 200 characters)");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(trimmedTitle);
      setTitle(""); // Clear input after successful submission
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            disabled={isLoading}
            className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="New task title"
            maxLength={200}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Add task"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adding...
            </span>
          ) : (
            "Add Task"
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Character count helper */}
      {title.length > 150 && (
        <p
          className={`text-sm ${
            title.length > 200 ? "text-red-600" : "text-gray-600"
          }`}
        >
          {title.length} / 200 characters
        </p>
      )}
    </form>
  );
}
