import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { workflowsTable } from "./workflows";

export const workflowVersionsTable = pgTable("workflow_versions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflowsTable.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  label: text("label").default(""),
  definition: jsonb("definition").$type<{ nodes: any[]; edges: any[] }>().notNull().default({ nodes: [], edges: [] }),
  nodeCount: integer("node_count").default(0),
  edgeCount: integer("edge_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WorkflowVersion = typeof workflowVersionsTable.$inferSelect;
