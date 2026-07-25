/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { TaskPriority } from "./taskPriority";
import type { TaskStatus } from "./taskStatus";

export interface Task {
  id: number;
  projectId: number;
  /** @nullable */
  milestoneId?: number | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}
