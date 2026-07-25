/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { MemoryItemInputCategory } from "./memoryItemInputCategory";

export interface MemoryItemInput {
  /** @minLength 1 */
  title: string;
  content: string;
  category?: MemoryItemInputCategory;
  tags?: string[];
  pinned?: boolean;
  /** @nullable */
  projectId?: number | null;
}
