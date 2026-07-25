import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import {
  CreateConversationBody,
  UpdateConversationBody,
  GetConversationParams,
  UpdateConversationParams,
  DeleteConversationParams,
  SendMessageBody,
  SendMessageParams,
  ListMessagesParams,
} from "@workspace/api-zod";
import { getLLMProvider } from "../lib/config";
import { LLMProviderError, getAgentSystemInstruction } from "../lib/llm";

const router: IRouter = Router();

/**
 * Build a single prompt string from message history + new user content.
 * Used for generation with providers that don't support multi-turn history
 * natively (like Ollama's /api/generate).
 */
function buildPrompt(
  history: Array<{ role: string; content: string }>,
  newContent: string,
): string {
  const parts: string[] = [];
  for (const msg of history) {
    const role = msg.role === "assistant" ? "Assistant" : "User";
    parts.push(`${role}: ${msg.content}`);
  }
  parts.push(`User: ${newContent}`);
  parts.push("Assistant:");
  return parts.join("\n\n");
}

async function serializeConversation(conv: typeof conversationsTable.$inferSelect) {
  const [msgCount] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conv.id));
  return {
    ...conv,
    messageCount: Number(msgCount.count),
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  };
}

router.get("/conversations", async (_req, res): Promise<void> => {
  const convs = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt));
  const serialized = await Promise.all(convs.map(serializeConversation));
  res.json(serialized);
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, agentType, projectId, pinned } = parsed.data;
  const [conv] = await db
    .insert(conversationsTable)
    .values({
      title,
      agentType: agentType ?? "general",
      projectId: projectId ?? null,
      pinned: pinned ?? false,
    })
    .returning();
  res.status(201).json(await serializeConversation(conv));
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(await serializeConversation(conv));
});

router.patch("/conversations/:id", async (req, res): Promise<void> => {
  const params = UpdateConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [conv] = await db
    .update(conversationsTable)
    .set(parsed.data)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json(await serializeConversation(conv));
});

router.delete("/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.sendStatus(204);
});

// ── Messages ─────────────────────────────────────────────────

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);
  res.json(
    messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  );
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conversationId = params.data.id;
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(messagesTable).values({
    conversationId,
    role: "user",
    content: parsed.data.content,
  });

  // Get full history for AI
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt);

  const systemInstruction = getAgentSystemInstruction(conv.agentType);

  try {
    const provider = getLLMProvider();
    const prompt = buildPrompt(history.slice(0, -1), parsed.data.content);
    const aiContent = await provider.generate(prompt, {
      systemInstruction,
      maxOutputTokens: 8192,
    });

    const [assistantMessage] = await db
      .insert(messagesTable)
      .values({ conversationId, role: "assistant", content: aiContent })
      .returning();

    // Touch conversation updatedAt
    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversationId));

    res.status(201).json({
      ...assistantMessage,
      createdAt: assistantMessage.createdAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof LLMProviderError) {
      const statusMap: Record<string, number> = {
        PROVIDER_UNAVAILABLE: 503,
        QUOTA_EXCEEDED: 429,
        VALIDATION_ERROR: 400,
        UNEXPECTED_ERROR: 500,
      };
      const status = statusMap[err.code] ?? 500;
      res.status(status).json({
        code: err.code,
        provider: err.provider,
        message: err.message,
      });
      return;
    }
    req.log.error({ err }, "AI generation failed");
    res.status(500).json({
      code: "UNEXPECTED_ERROR",
      provider: "unknown",
      message: "AI generation failed. Please try again.",
    });
  }
});

// SSE streaming endpoint (not in OpenAPI spec, consumed directly via fetch)
router.post("/conversations/:id/stream", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const conversationId = parseInt(rawId, 10);
  if (isNaN(conversationId)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const body = req.body as { content?: string };
  if (!body.content || typeof body.content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message first
  await db.insert(messagesTable).values({
    conversationId,
    role: "user",
    content: body.content,
  });

  // Get history
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(messagesTable.createdAt);

  const systemInstruction = getAgentSystemInstruction(conv.agentType);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  let fullResponse = "";

  try {
    const provider = getLLMProvider();
    const prompt = buildPrompt(history.slice(0, -1), body.content);

    for await (const chunk of provider.stream(prompt, {
      systemInstruction,
      maxOutputTokens: 8192,
    })) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    // Save assistant message
    await db.insert(messagesTable).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
    });

    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversationId));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    if (err instanceof LLMProviderError) {
      const errorPayload = {
        code: err.code,
        provider: err.provider,
        message: err.message,
      };
      res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
      res.end();
      return;
    }
    req.log.error({ err }, "Streaming AI failed");
    res.write(
      `data: ${JSON.stringify({ code: "UNEXPECTED_ERROR", provider: "unknown", message: "AI generation failed." })}\n\n`,
    );
    res.end();
  }
});

export default router;
