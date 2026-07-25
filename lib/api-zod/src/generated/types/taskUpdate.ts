/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { TaskUpdatePriority } from "./taskUpdatePriority";
import type { TaskUpdateStatus } from "./taskUpdateStatus";

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskUpdateStatus;
  priority?: TaskUpdatePriority;
  /** @nullable */
  milestoneId?: number | null;
}
