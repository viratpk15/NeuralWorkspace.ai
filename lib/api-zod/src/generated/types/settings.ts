/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { SettingsTheme } from "./settingsTheme";

export interface Settings {
  id: number;
  theme: SettingsTheme;
  aiModel: string;
  workspaceName: string;
  memoryEnabled?: boolean;
  updatedAt: string;
}
