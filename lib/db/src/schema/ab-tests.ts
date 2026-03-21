import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { agentsTable } from "./agents";

export const abTestsTable = pgTable("ab_tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("draft"),
  agentAId: integer("agent_a_id").notNull().references(() => agentsTable.id),
  agentBId: integer("agent_b_id").notNull().references(() => agentsTable.id),
  testPrompts: jsonb("test_prompts").$type<string[]>().default([]),
  totalRuns: integer("total_runs").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const abTestResultsTable = pgTable("ab_test_results", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => abTestsTable.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  agentAResponse: text("agent_a_response").default(""),
  agentBResponse: text("agent_b_response").default(""),
  agentATokens: integer("agent_a_tokens").default(0),
  agentBTokens: integer("agent_b_tokens").default(0),
  agentADuration: real("agent_a_duration").default(0),
  agentBDuration: real("agent_b_duration").default(0),
  agentACost: real("agent_a_cost").default(0),
  agentBCost: real("agent_b_cost").default(0),
  winner: text("winner").default(""),
  scores: jsonb("scores").$type<{
    agentA: { relevance: number; coherence: number; helpfulness: number; overall: number };
    agentB: { relevance: number; coherence: number; helpfulness: number; overall: number };
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAbTestSchema = createInsertSchema(abTestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTest = typeof abTestsTable.$inferSelect;

export const insertAbTestResultSchema = createInsertSchema(abTestResultsTable).omit({ id: true, createdAt: true });
export type InsertAbTestResult = z.infer<typeof insertAbTestResultSchema>;
export type AbTestResult = typeof abTestResultsTable.$inferSelect;
