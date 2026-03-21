import { pgTable, serial, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

export const promptsTable = pgTable("prompts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  tags: jsonb("tags").$type<string[]>().default([]),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
