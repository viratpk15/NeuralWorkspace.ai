/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { DocumentationItemDocType } from "./documentationItemDocType";

export interface DocumentationItem {
  id: number;
  title: string;
  docType: DocumentationItemDocType;
  content: string;
  /** @nullable */
  projectId?: number | null;
  createdAt: string;
  updatedAt: string;
}
