import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { knowledgeBasesTable, documentsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  CreateKnowledgeBaseBody,
  GetKnowledgeBaseParams,
  DeleteKnowledgeBaseParams,
  ListDocumentsParams,
  AddDocumentBody,
  AddDocumentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/knowledge-bases", async (_req, res) => {
  try {
    const kbs = await db.select().from(knowledgeBasesTable).orderBy(knowledgeBasesTable.createdAt);
    res.json(kbs);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/knowledge-bases", async (req, res) => {
  try {
    const body = CreateKnowledgeBaseBody.parse(req.body);
    const [kb] = await db.insert(knowledgeBasesTable).values(body).returning();
    res.status(201).json(kb);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/knowledge-bases/:knowledgeBaseId", async (req, res) => {
  try {
    const { knowledgeBaseId } = GetKnowledgeBaseParams.parse(req.params);
    const [kb] = await db.select().from(knowledgeBasesTable).where(eq(knowledgeBasesTable.id, knowledgeBaseId));
    if (!kb) return res.status(404).json({ error: "Knowledge base not found" });
    res.json(kb);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/knowledge-bases/:knowledgeBaseId", async (req, res) => {
  try {
    const { knowledgeBaseId } = DeleteKnowledgeBaseParams.parse(req.params);
    await db.delete(knowledgeBasesTable).where(eq(knowledgeBasesTable.id, knowledgeBaseId));
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/knowledge-bases/:knowledgeBaseId/documents", async (req, res) => {
  try {
    const { knowledgeBaseId } = ListDocumentsParams.parse(req.params);
    const docs = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.knowledgeBaseId, knowledgeBaseId))
      .orderBy(documentsTable.createdAt);
    res.json(docs);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/knowledge-bases/:knowledgeBaseId/documents", async (req, res) => {
  try {
    const { knowledgeBaseId } = AddDocumentParams.parse(req.params);
    const body = AddDocumentBody.parse(req.body);

    const [kb] = await db.select().from(knowledgeBasesTable).where(eq(knowledgeBasesTable.id, knowledgeBaseId));
    if (!kb) return res.status(404).json({ error: "Knowledge base not found" });

    const chunkCount = Math.ceil((body.content?.length || 0) / 500);

    const [doc] = await db
      .insert(documentsTable)
      .values({
        knowledgeBaseId,
        title: body.title,
        content: body.content,
        sourceType: body.sourceType || "text",
        sourceUrl: body.sourceUrl,
        chunkCount,
        status: "indexed",
      })
      .returning();

    await db
      .update(knowledgeBasesTable)
      .set({
        documentCount: sql`${knowledgeBasesTable.documentCount} + 1`,
        totalChunks: sql`${knowledgeBasesTable.totalChunks} + ${chunkCount}`,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeBasesTable.id, knowledgeBaseId));

    res.status(201).json(doc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
