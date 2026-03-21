import { pgTable, serial, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  role: text("role").notNull(),
  goal: text("goal").default(""),
  backstory: text("backstory").default(""),
  model: text("model").notNull().default("gpt-4o"),
  provider: text("provider").notNull().default("openai"),
  temperature: real("temperature").default(0.7),
  maxTokens: integer("max_tokens").default(4096),
  tools: jsonb("tools").$type<string[]>().default([]),
  memoryEnabled: boolean("memory_enabled").default(true),
  status: text("status").notNull().default("active"),
  systemPrompt: text("system_prompt").default(""),
  icon: text("icon").default("bot"),
  color: text("color").default("#3b82f6"),
  executionCount: integer("execution_count").default(0),
  avgResponseTime: real("avg_response_time").default(0),
  successRate: real("success_rate").default(100),
  lastPingAt: timestamp("last_ping_at"),
  healthStatus: text("health_status").default("unknown"),
  healthMessage: text("health_message").default(""),
  healthLatency: real("health_latency"),
  tags: jsonb("tags").$type<string[]>().default([]),
  safetyFilter: boolean("safety_filter").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
