/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { SettingsUpdateTheme } from "./settingsUpdateTheme";

export interface SettingsUpdate {
  theme?: SettingsUpdateTheme;
  aiModel?: string;
  workspaceName?: string;
  memoryEnabled?: boolean;
}
