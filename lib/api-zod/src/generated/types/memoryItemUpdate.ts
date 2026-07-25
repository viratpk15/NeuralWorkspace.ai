/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { MemoryItemUpdateCategory } from "./memoryItemUpdateCategory";

export interface MemoryItemUpdate {
  title?: string;
  content?: string;
  category?: MemoryItemUpdateCategory;
  tags?: string[];
  pinned?: boolean;
  /** @nullable */
  projectId?: number | null;
}
