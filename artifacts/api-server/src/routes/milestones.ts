import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, milestonesTable } from "@workspace/db";
import {
  CreateMilestoneBody,
  CreateMilestoneParams,
  UpdateMilestoneBody,
  UpdateMilestoneParams,
  DeleteMilestoneParams,
  ListProjectMilestonesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeMilestone(m: typeof milestonesTable.$inferSelect) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/projects/:projectId/milestones", async (req, res): Promise<void> => {
  const params = ListProjectMilestonesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const milestones = await db
    .select()
    .from(milestonesTable)
    .where(eq(milestonesTable.projectId, params.data.projectId));
  res.json(milestones.map(serializeMilestone));
});

router.post("/projects/:projectId/milestones", async (req, res): Promise<void> => {
  const params = CreateMilestoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateMilestoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, description, status, dueDate } = parsed.data;
  const [milestone] = await db
    .insert(milestonesTable)
    .values({
      projectId: params.data.projectId,
      name,
      description: description ?? "",
      status: status ?? "pending",
      dueDate: dueDate ?? null,
    })
    .returning();
  res.status(201).json(serializeMilestone(milestone));
});

router.patch("/milestones/:id", async (req, res): Promise<void> => {
  const params = UpdateMilestoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMilestoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [milestone] = await db
    .update(milestonesTable)
    .set(parsed.data)
    .where(eq(milestonesTable.id, params.data.id))
    .returning();
  if (!milestone) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }
  res.json(serializeMilestone(milestone));
});

router.delete("/milestones/:id", async (req, res): Promise<void> => {
  const params = DeleteMilestoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(milestonesTable)
    .where(eq(milestonesTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
