import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workflowsTable = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("draft"),
  tags: jsonb("tags").$type<string[]>().default([]),
  definition: jsonb("definition").$type<{ nodes: any[]; edges: any[] }>().notNull().default({ nodes: [], edges: [] }),
  executionCount: integer("execution_count").default(0),
  lastRunAt: timestamp("last_run_at"),
  avgDuration: real("avg_duration").default(0),
  successRate: real("success_rate").default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorkflowSchema = createInsertSchema(workflowsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflowsTable.$inferSelect;
