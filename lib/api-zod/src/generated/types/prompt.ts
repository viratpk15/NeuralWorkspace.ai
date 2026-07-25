/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { PromptCategory } from "./promptCategory";

export interface Prompt {
  id: number;
  title: string;
  content: string;
  category: PromptCategory;
  tags: string[];
  favorite: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
