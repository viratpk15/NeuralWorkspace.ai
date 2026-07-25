/**
 * Auto-generated API client types.
 * Managed by the orval code generation pipeline.
 * Api
 * Neural Workspace API
 * OpenAPI spec version: 0.1.0
 */
import type { ActivityItem } from "./activityItem";
import type { ProjectProgressItem } from "./projectProgressItem";

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalConversations: number;
  totalMemoryItems: number;
  totalPrompts: number;
  recentActivity: ActivityItem[];
  projectProgress: ProjectProgressItem[];
}
