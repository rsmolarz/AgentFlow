import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const evalRunsTable = pgTable("eval_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  agentId: integer("agent_id"),
  agentName: text("agent_name").notNull().default(""),
  status: text("status").notNull().default("pending"),
  score: real("score").default(0),
  totalTests: integer("total_tests").default(0),
  passedTests: integer("passed_tests").default(0),
  failedTests: integer("failed_tests").default(0),
  avgLatency: real("avg_latency").default(0),
  tokenUsage: integer("token_usage").default(0),
  cost: real("cost").default(0),
  metrics: jsonb("metrics").$type<{ accuracy: number; relevance: number; coherence: number; safety: number }>().default({ accuracy: 0, relevance: 0, coherence: 0, safety: 0 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEvalRunSchema = createInsertSchema(evalRunsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvalRun = z.infer<typeof insertEvalRunSchema>;
export type EvalRun = typeof evalRunsTable.$inferSelect;
