/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskStatus = {
  todo: "todo",
  in_progress: "in_progress",
  review: "review",
  done: "done",
  cancelled: "cancelled",
} as const;
