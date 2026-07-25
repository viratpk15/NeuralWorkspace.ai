/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ProjectInputStatus } from "./projectInputStatus";

export interface ProjectInput {
  /** @minLength 1 */
  name: string;
  description?: string;
  status?: ProjectInputStatus;
  techStack?: string[];
  requirements?: string[];
}
