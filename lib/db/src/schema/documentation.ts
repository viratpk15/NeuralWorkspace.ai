import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentationTable = pgTable("documentation", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  docType: text("doc_type").notNull().default("readme"),
  content: text("content").notNull(),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertDocumentationSchema = createInsertSchema(documentationTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDocumentation = z.infer<typeof insertDocumentationSchema>;
export type Documentation = typeof documentationTable.$inferSelect;
