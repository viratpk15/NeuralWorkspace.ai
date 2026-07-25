/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { PromptInputCategory } from "./promptInputCategory";

export interface PromptInput {
  /** @minLength 1 */
  title: string;
  /** @minLength 1 */
  content: string;
  category?: PromptInputCategory;
  tags?: string[];
  favorite?: boolean;
}
