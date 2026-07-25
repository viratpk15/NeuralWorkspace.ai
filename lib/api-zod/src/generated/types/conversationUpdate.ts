/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ConversationUpdateAgentType } from "./conversationUpdateAgentType";

export interface ConversationUpdate {
  title?: string;
  agentType?: ConversationUpdateAgentType;
  pinned?: boolean;
  /** @nullable */
  projectId?: number | null;
}
