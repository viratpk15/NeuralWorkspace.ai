/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { MemoryItemCategory } from "./memoryItemCategory";

export interface MemoryItem {
  id: number;
  title: string;
  content: string;
  category: MemoryItemCategory;
  tags: string[];
  pinned: boolean;
  /** @nullable */
  projectId?: number | null;
  createdAt: string;
  updatedAt: string;
}
