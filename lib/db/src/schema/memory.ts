import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memoryItemsTable = pgTable("memory_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  tags: text("tags").array().notNull().default([]),
  pinned: boolean("pinned").notNull().default(false),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertMemoryItemSchema = createInsertSchema(memoryItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMemoryItem = z.infer<typeof insertMemoryItemSchema>;
export type MemoryItem = typeof memoryItemsTable.$inferSelect;
