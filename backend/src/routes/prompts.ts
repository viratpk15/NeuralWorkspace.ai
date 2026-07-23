import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, promptsTable } from "@workspace/db";
import {
  CreatePromptBody,
  UpdatePromptBody,
  GetPromptParams,
  UpdatePromptParams,
  DeletePromptParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serialize(p: typeof promptsTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/prompts", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(promptsTable)
    .orderBy(desc(promptsTable.updatedAt));
  res.json(items.map(serialize));
});

router.post("/prompts", async (req, res): Promise<void> => {
  const parsed = CreatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, content, category, tags, favorite } = parsed.data;
  const [item] = await db
    .insert(promptsTable)
    .values({
      title,
      content,
      category: category ?? "general",
      tags: tags ?? [],
      favorite: favorite ?? false,
      version: 1,
    })
    .returning();
  res.status(201).json(serialize(item));
});

router.get("/prompts/:id", async (req, res): Promise<void> => {
  const params = GetPromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }
  res.json(serialize(item));
});

router.patch("/prompts/:id", async (req, res): Promise<void> => {
  const params = UpdatePromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Increment version when content changes
  const [existing] = await db
    .select()
    .from(promptsTable)
    .where(eq(promptsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.content && parsed.data.content !== existing.content) {
    updateData.version = existing.version + 1;
  }

  const [item] = await db
    .update(promptsTable)
    .set(updateData)
    .where(eq(promptsTable.id, params.data.id))
    .returning();
  res.json(serialize(item));
});

router.delete("/prompts/:id", async (req, res): Promise<void> => {
  const params = DeletePromptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(promptsTable)
    .where(eq(promptsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
