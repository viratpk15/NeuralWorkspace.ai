/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ArchitectureDocInputDocType } from "./architectureDocInputDocType";

export interface ArchitectureDocInput {
  /** @minLength 1 */
  title: string;
  content: string;
  docType: ArchitectureDocInputDocType;
  /** @nullable */
  projectId?: number | null;
}
