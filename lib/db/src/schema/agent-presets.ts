import { pgTable, serial, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const agentPresets = pgTable("agent_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("🤖"),
  category: text("category").default("general"),
  systemPrompt: text("system_prompt"),
  model: text("model").default("gpt-4o"),
  tools: jsonb("tools").default([]),
  config: jsonb("config").default({}),
  builtin: boolean("builtin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
