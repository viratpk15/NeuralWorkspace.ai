/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ConversationInputAgentType } from "./conversationInputAgentType";

export interface ConversationInput {
  /** @minLength 1 */
  title: string;
  agentType: ConversationInputAgentType;
  /** @nullable */
  projectId?: number | null;
  pinned?: boolean;
}
