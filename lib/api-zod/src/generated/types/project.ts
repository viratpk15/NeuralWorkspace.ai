/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ProjectStatus } from "./projectStatus";

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  techStack: string[];
  requirements: string[];
  createdAt: string;
  updatedAt: string;
}
