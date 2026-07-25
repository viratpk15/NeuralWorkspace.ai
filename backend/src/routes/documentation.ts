import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, documentationTable } from "@workspace/db";
import {
  CreateDocumentationBody,
  GenerateDocumentationBody,
  GetDocumentationParams,
  UpdateDocumentationParams,
  UpdateDocumentationBody,
  DeleteDocumentationParams,
} from "@workspace/api-zod";
import { getLLMProvider } from "../lib/config";
import { LLMProviderError } from "../lib/llm";
import { initSSEStream, writeSSEChunk, endSSEStream, errorSSEStream } from "../lib/stream-utils";

const router: IRouter = Router();

function serialize(doc: typeof documentationTable.$inferSelect) {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

router.get("/documentation", async (_req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentationTable)
    .orderBy(desc(documentationTable.updatedAt));
  res.json(docs.map(serialize));
});

router.post("/documentation", async (req, res): Promise<void> => {
  const parsed = CreateDocumentationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db
    .insert(documentationTable)
    .values({
      title: parsed.data.title,
      docType: parsed.data.docType,
      content: parsed.data.content,
      projectId: parsed.data.projectId ?? null,
    })
    .returning();
  res.status(201).json(serialize(doc));
});

router.post("/documentation/generate", async (req, res): Promise<void> => {
  const parsed = GenerateDocumentationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { docType, prompt, projectId, projectName, techStack } = parsed.data;

  const docTypeLabels: Record<string, string> = {
    readme: "README.md",
    api_docs: "API Documentation",
    architecture: "Architecture Documentation",
    developer_guide: "Developer Guide",
    deployment: "Deployment Guide",
    setup: "Setup Guide",
    overview: "Project Overview",
    changelog: "Changelog",
  };

  const systemPrompt = `You are an expert Technical Writer specializing in software documentation.
Generate professional, clear, and comprehensive documentation in Markdown format.
Follow best practices for the specific document type. Be specific and actionable.`;

  const userPrompt = `Generate a ${docTypeLabels[docType] ?? docType} document.

Project: ${projectName ?? "Unnamed Project"}
Tech Stack: ${techStack?.join(", ") ?? "Not specified"}

Context/Requirements:
${prompt}

Generate a complete, production-ready ${docTypeLabels[docType] ?? docType} in Markdown format.
Include all standard sections for this document type. Be thorough and professional.`;

  try {
    const provider = getLLMProvider();
    const content = await provider.generate(userPrompt, {
      systemInstruction: systemPrompt,
      maxOutputTokens: 8192,
    });

    const title = `${docTypeLabels[docType] ?? docType}${projectName ? ` - ${projectName}` : ""}`;

    const [doc] = await db
      .insert(documentationTable)
      .values({ title, docType, content, projectId: projectId ?? null })
      .returning();

    res.status(201).json(serialize(doc));
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
    req.log.error({ err }, "Documentation generation failed");
    res.status(500).json({
      code: "UNEXPECTED_ERROR",
      provider: "unknown",
      message: "AI generation failed. Please try again.",
    });
  }
});

// SSE streaming endpoint for documentation generation
router.post("/documentation/generate/stream", async (req, res): Promise<void> => {
  const parsed = GenerateDocumentationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { docType, prompt, projectId, projectName, techStack } = parsed.data;

  const docTypeLabels: Record<string, string> = {
    readme: "README.md",
    api_docs: "API Documentation",
    architecture: "Architecture Documentation",
    developer_guide: "Developer Guide",
    deployment: "Deployment Guide",
    setup: "Setup Guide",
    overview: "Project Overview",
    changelog: "Changelog",
  };

  const systemPrompt = `You are an expert Technical Writer specializing in software documentation.
Generate professional, clear, and comprehensive documentation in Markdown format.
Follow best practices for the specific document type. Be specific and actionable.`;

  const userPrompt = `Generate a ${docTypeLabels[docType] ?? docType} document.

Project: ${projectName ?? "Unnamed Project"}
Tech Stack: ${techStack?.join(", ") ?? "Not specified"}

Context/Requirements:
${prompt}

Generate a complete, production-ready ${docTypeLabels[docType] ?? docType} in Markdown format.
Include all standard sections for this document type. Be thorough and professional.`;

  initSSEStream(res);

  let fullContent = "";

  try {
    const provider = getLLMProvider();

    for await (const chunk of provider.stream(userPrompt, {
      systemInstruction: systemPrompt,
      maxOutputTokens: 8192,
    })) {
      fullContent += chunk;
      writeSSEChunk(res, { content: chunk });
    }

    // Save to database after streaming finishes
    const title = `${docTypeLabels[docType] ?? docType}${projectName ? ` - ${projectName}` : ""}`;
    const [doc] = await db
      .insert(documentationTable)
      .values({ title, docType, content: fullContent, projectId: projectId ?? null })
      .returning();

    endSSEStream(res, { document: serialize(doc) });
  } catch (err) {
    req.log.error({ err }, "Documentation streaming generation failed");
    errorSSEStream(res, err);
  }
});

router.get("/documentation/:id", async (req, res): Promise<void> => {
  const params = GetDocumentationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doc] = await db
    .select()
    .from(documentationTable)
    .where(eq(documentationTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Documentation not found" });
    return;
  }
  res.json(serialize(doc));
});

router.patch("/documentation/:id", async (req, res): Promise<void> => {
  const params = UpdateDocumentationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDocumentationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db
    .update(documentationTable)
    .set(parsed.data)
    .where(eq(documentationTable.id, params.data.id))
    .returning();
  if (!doc) {
    res.status(404).json({ error: "Documentation not found" });
    return;
  }
  res.json(serialize(doc));
});

router.delete("/documentation/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(documentationTable)
    .where(eq(documentationTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Documentation not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
