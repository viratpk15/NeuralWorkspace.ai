/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { MilestoneInputStatus } from "./milestoneInputStatus";

export interface MilestoneInput {
  /** @minLength 1 */
  name: string;
  description?: string;
  dueDate?: string;
  status?: MilestoneInputStatus;
}
