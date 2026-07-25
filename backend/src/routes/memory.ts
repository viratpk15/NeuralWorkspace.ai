import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, memoryItemsTable } from "@workspace/db";
import {
  CreateMemoryItemBody,
  UpdateMemoryItemBody,
  GetMemoryItemParams,
  UpdateMemoryItemParams,
  DeleteMemoryItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(m: typeof memoryItemsTable.$inferSelect) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

router.get("/memory", async (_req, res): Promise<void> => {
  const items = await db.select().from(memoryItemsTable).orderBy(desc(memoryItemsTable.updatedAt));
  res.json(items.map(serialize));
});

router.post("/memory", async (req, res): Promise<void> => {
  const parsed = CreateMemoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, content, category, tags, pinned, projectId } = parsed.data;
  const [item] = await db
    .insert(memoryItemsTable)
    .values({
      title,
      content,
      category: category ?? "general",
      tags: tags ?? [],
      pinned: pinned ?? false,
      projectId: projectId ?? null,
    })
    .returning();
  res.status(201).json(serialize(item));
});

router.get("/memory/:id", async (req, res): Promise<void> => {
  const params = GetMemoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select()
    .from(memoryItemsTable)
    .where(eq(memoryItemsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Memory item not found" });
    return;
  }
  res.json(serialize(item));
});

router.patch("/memory/:id", async (req, res): Promise<void> => {
  const params = UpdateMemoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMemoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db
    .update(memoryItemsTable)
    .set(parsed.data)
    .where(eq(memoryItemsTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Memory item not found" });
    return;
  }
  res.json(serialize(item));
});

router.delete("/memory/:id", async (req, res): Promise<void> => {
  const params = DeleteMemoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(memoryItemsTable)
    .where(eq(memoryItemsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Memory item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
