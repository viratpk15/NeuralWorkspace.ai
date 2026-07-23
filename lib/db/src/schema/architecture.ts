import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const architectureDocsTable = pgTable("architecture_docs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  docType: text("doc_type").notNull().default("full"),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArchitectureDocSchema = createInsertSchema(architectureDocsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArchitectureDoc = z.infer<typeof insertArchitectureDocSchema>;
export type ArchitectureDoc = typeof architectureDocsTable.$inferSelect;
