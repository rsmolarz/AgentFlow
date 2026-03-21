import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workflowsTable } from "./workflows";

export const bulkExecutionsTable = pgTable("bulk_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflowsTable.id, { onDelete: "cascade" }),
  workflowName: text("workflow_name").default(""),
  status: text("status").notNull().default("pending"),
  totalRows: integer("total_rows").default(0),
  completedRows: integer("completed_rows").default(0),
  failedRows: integer("failed_rows").default(0),
  headers: jsonb("headers").$type<string[]>().default([]),
  results: jsonb("results").$type<{ row: number; status: string; input: Record<string, any>; output?: Record<string, any>; error?: string; duration?: number }[]>().default([]),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: real("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BulkExecution = typeof bulkExecutionsTable.$inferSelect;
