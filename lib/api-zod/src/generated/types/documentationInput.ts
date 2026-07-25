/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { DocumentationInputDocType } from "./documentationInputDocType";

export interface DocumentationInput {
  /** @minLength 1 */
  title: string;
  docType: DocumentationInputDocType;
  content: string;
  /** @nullable */
  projectId?: number | null;
}
