/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ProjectUpdateStatus } from "./projectUpdateStatus";

export interface ProjectUpdate {
  /** @minLength 1 */
  name?: string;
  description?: string;
  status?: ProjectUpdateStatus;
  techStack?: string[];
  requirements?: string[];
}
