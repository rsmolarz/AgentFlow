import { pgTable, serial, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull(),
  scopes: jsonb("scopes").$type<string[]>().default([]),
  lastUsedAt: timestamp("last_used_at"),
  revoked: boolean("revoked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const webauthnCredentialsTable = pgTable("webauthn_credentials", {
  id: serial("id").primaryKey(),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: text("counter").default("0"),
  deviceName: text("device_name").default("YubiKey"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeysTable.$inferSelect;

export type WebauthnCredential = typeof webauthnCredentialsTable.$inferSelect;
