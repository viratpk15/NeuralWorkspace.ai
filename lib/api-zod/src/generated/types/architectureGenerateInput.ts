/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ArchitectureGenerateInputDocType } from "./architectureGenerateInputDocType";

export interface ArchitectureGenerateInput {
  /** @minLength 1 */
  prompt: string;
  docType: ArchitectureGenerateInputDocType;
  /** @nullable */
  projectId?: number | null;
  projectName?: string;
  techStack?: string[];
}
