import { pgTable, serial, integer, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workflowsTable } from "./workflows";

export const webhooksTable = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  workflowId: integer("workflow_id").references(() => workflowsTable.id, { onDelete: "set null" }),
  method: text("method").notNull().default("POST"),
  enabled: boolean("enabled").notNull().default(true),
  secret: text("secret"),
  description: text("description").default(""),
  lastCalledAt: timestamp("last_called_at"),
  callCount: integer("call_count").notNull().default(0),
  lastPayload: jsonb("last_payload"),
  lastStatus: text("last_status").default("never"),
  headers: jsonb("headers").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
