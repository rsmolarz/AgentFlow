import { pgTable, serial, text, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";

export const costAlertsTable = pgTable("cost_alerts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 }).notNull(),
  currentSpend: numeric("current_spend", { precision: 12, scale: 2 }).notNull().default("0"),
  alertThreshold: integer("alert_threshold").notNull().default(80),
  enabled: boolean("enabled").notNull().default(true),
  alertType: text("alert_type").notNull().default("monthly"),
  notifyEmail: boolean("notify_email").notNull().default(true),
  notifyInApp: boolean("notify_in_app").notNull().default(true),
  triggered: boolean("triggered").notNull().default(false),
  triggeredAt: timestamp("triggered_at"),
  resetDay: integer("reset_day").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
