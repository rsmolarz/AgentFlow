import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});
