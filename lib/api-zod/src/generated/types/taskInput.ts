/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { TaskInputPriority } from "./taskInputPriority";
import type { TaskInputStatus } from "./taskInputStatus";

export interface TaskInput {
  /** @minLength 1 */
  title: string;
  description?: string;
  status?: TaskInputStatus;
  priority?: TaskInputPriority;
  /** @nullable */
  milestoneId?: number | null;
}
