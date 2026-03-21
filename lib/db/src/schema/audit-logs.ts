import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  userId: text("user_id").default("system"),
  userName: text("user_name").default("System"),
  details: jsonb("details").default({}),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});
