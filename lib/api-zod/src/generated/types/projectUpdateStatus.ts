/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */

export type ProjectUpdateStatus = (typeof ProjectUpdateStatus)[keyof typeof ProjectUpdateStatus];

export const ProjectUpdateStatus = {
  planning: "planning",
  active: "active",
  paused: "paused",
  completed: "completed",
  archived: "archived",
} as const;
