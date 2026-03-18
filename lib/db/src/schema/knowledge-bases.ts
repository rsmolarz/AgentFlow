import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const knowledgeBasesTable = pgTable("knowledge_bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  documentCount: integer("document_count").default(0),
  totalChunks: integer("total_chunks").default(0),
  embeddingModel: text("embedding_model").default("text-embedding-3-small"),
  status: text("status").notNull().default("ready"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBasesTable.$inferSelect;

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  knowledgeBaseId: integer("knowledge_base_id").notNull().references(() => knowledgeBasesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").default(""),
  sourceType: text("source_type").default("text"),
  sourceUrl: text("source_url"),
  chunkCount: integer("chunk_count").default(0),
  status: text("status").notNull().default("processing"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
