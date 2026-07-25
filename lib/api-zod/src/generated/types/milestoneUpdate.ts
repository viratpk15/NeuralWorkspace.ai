/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { MilestoneUpdateStatus } from "./milestoneUpdateStatus";

export interface MilestoneUpdate {
  name?: string;
  description?: string;
  /** @nullable */
  dueDate?: string | null;
  status?: MilestoneUpdateStatus;
}
