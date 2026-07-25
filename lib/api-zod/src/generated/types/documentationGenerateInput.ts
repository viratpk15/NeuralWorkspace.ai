/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { DocumentationGenerateInputDocType } from "./documentationGenerateInputDocType";

export interface DocumentationGenerateInput {
  docType: DocumentationGenerateInputDocType;
  /** @minLength 1 */
  prompt: string;
  /** @nullable */
  projectId?: number | null;
  projectName?: string;
  techStack?: string[];
}
