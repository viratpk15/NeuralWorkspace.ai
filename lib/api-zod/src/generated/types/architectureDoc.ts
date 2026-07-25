/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ArchitectureDocDocType } from "./architectureDocDocType";

export interface ArchitectureDoc {
  id: number;
  title: string;
  content: string;
  docType: ArchitectureDocDocType;
  /** @nullable */
  projectId?: number | null;
  createdAt: string;
  updatedAt: string;
}
