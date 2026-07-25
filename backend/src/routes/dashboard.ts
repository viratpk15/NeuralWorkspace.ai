import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  tasksTable,
  conversationsTable,
  memoryItemsTable,
  promptsTable,
} from "@workspace/db";
import { sql, count, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const [projectStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where status = 'active')`,
    })
    .from(projectsTable);

  const [taskStats] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where status = 'done')`,
    })
    .from(tasksTable);

  const [convCount] = await db.select({ total: count() }).from(conversationsTable);
  const [memCount] = await db.select({ total: count() }).from(memoryItemsTable);
  const [promptCount] = await db.select({ total: count() }).from(promptsTable);

  // Recent activity: last 10 created items across projects + tasks + conversations
  const recentProjects = await db
    .select({
      id: projectsTable.id,
      type: sql<string>`'project'`,
      description: sql<string>`'Project created: ' || ${projectsTable.name}`,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .orderBy(sql`${projectsTable.createdAt} desc`)
    .limit(4);

  const recentTasks = await db
    .select({
      id: tasksTable.id,
      type: sql<string>`'task'`,
      description: sql<string>`'Task created: ' || ${tasksTable.title}`,
      createdAt: tasksTable.createdAt,
    })
    .from(tasksTable)
    .orderBy(sql`${tasksTable.createdAt} desc`)
    .limit(3);

  const recentConversations = await db
    .select({
      id: conversationsTable.id,
      type: sql<string>`'conversation'`,
      description: sql<string>`'Conversation started: ' || ${conversationsTable.title}`,
      createdAt: conversationsTable.createdAt,
    })
    .from(conversationsTable)
    .orderBy(sql`${conversationsTable.createdAt} desc`)
    .limit(3);

  const allActivity = [...recentProjects, ...recentTasks, ...recentConversations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
    }));

  // Project progress
  const projects = await db
    .select()
    .from(projectsTable)
    .orderBy(sql`${projectsTable.updatedAt} desc`)
    .limit(6);
  const projectProgress = await Promise.all(
    projects.map(async (p) => {
      const [stats] = await db
        .select({
          total: count(),
          completed: sql<number>`count(*) filter (where status = 'done')`,
        })
        .from(tasksTable)
        .where(eq(tasksTable.projectId, p.id));
      return {
        id: p.id,
        name: p.name,
        totalTasks: Number(stats.total),
        completedTasks: Number(stats.completed),
        status: p.status,
      };
    }),
  );

  res.json({
    totalProjects: Number(projectStats.total),
    activeProjects: Number(projectStats.active),
    totalTasks: Number(taskStats.total),
    completedTasks: Number(taskStats.completed),
    totalConversations: Number(convCount.total),
    totalMemoryItems: Number(memCount.total),
    totalPrompts: Number(promptCount.total),
    recentActivity: allActivity,
    projectProgress,
  });
});

export default router;
