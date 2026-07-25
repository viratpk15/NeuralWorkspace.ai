/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { PromptUpdateCategory } from "./promptUpdateCategory";

export interface PromptUpdate {
  title?: string;
  content?: string;
  category?: PromptUpdateCategory;
  tags?: string[];
  favorite?: boolean;
}
