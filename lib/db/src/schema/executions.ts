import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workflowsTable } from "./workflows";

export const executionsTable = pgTable("executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflowsTable.id, { onDelete: "cascade" }),
  workflowName: text("workflow_name").default(""),
  status: text("status").notNull().default("pending"),
  inputData: jsonb("input_data").$type<Record<string, any>>().default({}),
  outputData: jsonb("output_data").$type<Record<string, any>>(),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: real("duration"),
  tokensUsed: integer("tokens_used").default(0),
  cost: real("cost").default(0),
  currentStep: text("current_step"),
  totalSteps: integer("total_steps").default(0),
  completedSteps: integer("completed_steps").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExecutionSchema = createInsertSchema(executionsTable).omit({ id: true, createdAt: true });
export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type Execution = typeof executionsTable.$inferSelect;

export const executionLogsTable = pgTable("execution_logs", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").notNull().references(() => executionsTable.id, { onDelete: "cascade" }),
  nodeId: text("node_id").notNull(),
  nodeName: text("node_name").default(""),
  nodeType: text("node_type").default(""),
  status: text("status").notNull().default("pending"),
  input: jsonb("input").$type<Record<string, any>>(),
  output: jsonb("output").$type<Record<string, any>>(),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: real("duration"),
  tokensUsed: integer("tokens_used").default(0),
});

export const insertExecutionLogSchema = createInsertSchema(executionLogsTable).omit({ id: true });
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
export type ExecutionLog = typeof executionLogsTable.$inferSelect;
