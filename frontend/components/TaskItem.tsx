"use client";

/**
 * TaskItem Component
 * Displays a single task with toggle, edit, and delete functionality
 */

import { useState } from "react";
import type { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => Promise<void>;
  onEdit: (taskId: string, title: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export default function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggle(task.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      alert("Task title cannot be empty");
      return;
    }

    if (editTitle.trim() === task.title) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onEdit(task.id, editTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Checkbox for completion status */}
      <input
        type="checkbox"
        checked={task.is_completed}
        onChange={handleToggle}
        disabled={isLoading}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 cursor-pointer"
        aria-label={`Mark "${task.title}" as ${task.is_completed ? "incomplete" : "complete"}`}
      />

      {/* Task title or edit input */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-1 text-gray-900 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            aria-label="Edit task title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveEdit();
              } else if (e.key === "Escape") {
                handleCancelEdit();
              }
            }}
          />
        ) : (
          <p
            className={`text-gray-900 truncate ${
              task.is_completed ? "line-through text-gray-500" : ""
            }`}
          >
            {task.title}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            {/* Save button */}
            <button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save changes"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
            {/* Cancel button */}
            <button
              onClick={handleCancelEdit}
              disabled={isLoading}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </>
        ) : showDeleteConfirm ? (
          <>
            {/* Confirm delete button */}
            <button
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Confirm delete"
            >
              {isLoading ? "Deleting..." : "Confirm"}
            </button>
            {/* Cancel delete button */}
            <button
              onClick={handleCancelDelete}
              disabled={isLoading}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel delete"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {/* Edit button */}
            <button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Edit task"
              title="Edit task"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </button>
            {/* Delete button */}
            <button
              onClick={handleDeleteClick}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete task"
              title="Delete task"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
