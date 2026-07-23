import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, architectureDocsTable } from "@workspace/db";
import {
  CreateArchitectureDocBody,
  GenerateArchitectureBody,
  GetArchitectureDocParams,
  UpdateArchitectureDocParams,
  UpdateArchitectureDocBody,
  DeleteArchitectureDocParams,
} from "@workspace/api-zod";
import { genai, DEFAULT_MODEL } from "../lib/gemini";

const router: IRouter = Router();

function serialize(doc: typeof architectureDocsTable.$inferSelect) {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

router.get("/architecture", async (_req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(architectureDocsTable)
    .orderBy(desc(architectureDocsTable.updatedAt));
  res.json(docs.map(serialize));
});

router.post("/architecture", async (req, res): Promise<void> => {
  const parsed = CreateArchitectureDocBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db
    .insert(architectureDocsTable)
    .values({
      title: parsed.data.title,
      content: parsed.data.content,
      docType: parsed.data.docType,
      projectId: parsed.data.projectId ?? null,
    })
    .returning();
  res.status(201).json(serialize(doc));
});

router.post("/architecture/generate", async (req, res): Promise<void> => {
  const parsed = GenerateArchitectureBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prompt, docType, projectId, projectName, techStack } = parsed.data;

  const docTypeLabels: Record<string, string> = {
    folder_structure: "Folder Structure",
    backend: "Backend Architecture",
    frontend: "Frontend Architecture",
    database: "Database Schema",
    api_design: "REST API Design",
    component_hierarchy: "Component Hierarchy",
    tech_recommendations: "Technology Recommendations",
    full: "Full System Architecture",
  };

  const systemPrompt = `You are an expert Software Architect. Generate detailed, professional software architecture documentation in Markdown format.
Include Mermaid diagrams where appropriate (use \`\`\`mermaid ... \`\`\` blocks).
Be specific, practical, and production-ready. Do not add unnecessary preamble.`;

  const userPrompt = `Generate a ${docTypeLabels[docType] ?? docType} document.

Project: ${projectName ?? "Unnamed Project"}
Tech Stack: ${techStack?.join(", ") ?? "Not specified"}

Requirements/Context:
${prompt}

Provide a comprehensive ${docTypeLabels[docType] ?? docType} in Markdown with:
- Clear sections and headers
- Mermaid diagrams where applicable
- Specific implementation details
- Best practices and rationale`;

  try {
    const result = await genai.models.generateContent({
      model: DEFAULT_MODEL,
      config: { systemInstruction: systemPrompt, maxOutputTokens: 8192 },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const content = result.text ?? "Failed to generate architecture document.";
    const title = `${docTypeLabels[docType] ?? docType}${projectName ? ` - ${projectName}` : ""}`;

    const [doc] = await db
      .insert(architectureDocsTable)
      .values({ title, content, docType, projectId: projectId ?? null })
      .returning();

    res.status(201).json(serialize(doc));
  } catch (err) {
    req.log.error({ err }, "Architecture generation failed");
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

router.get("/architecture/:id", async (req, res): Promise<void> => {
  const params = GetArchitectureDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doc] = await db
    .select()
    .from(architectureDocsTable)
    .where(eq(architectureDocsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Architecture document not found" });
    return;
  }
  res.json(serialize(doc));
});

router.patch("/architecture/:id", async (req, res): Promise<void> => {
  const params = UpdateArchitectureDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateArchitectureDocBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db
    .update(architectureDocsTable)
    .set(parsed.data)
    .where(eq(architectureDocsTable.id, params.data.id))
    .returning();
  if (!doc) {
    res.status(404).json({ error: "Architecture document not found" });
    return;
  }
  res.json(serialize(doc));
});

router.delete("/architecture/:id", async (req, res): Promise<void> => {
  const params = DeleteArchitectureDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(architectureDocsTable)
    .where(eq(architectureDocsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Architecture document not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
