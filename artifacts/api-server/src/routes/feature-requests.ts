import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { featureRequestsTable } from "@workspace/db/schema";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import {
  ListFeatureRequestsQueryParams,
  CreateFeatureRequestBody,
  UpdateFeatureRequestBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/feature-requests", async (req, res) => {
  try {
    const query = ListFeatureRequestsQueryParams.parse(req.query);
    const conditions = [];
    if (query.status) conditions.push(eq(featureRequestsTable.status, query.status));
    if (query.category) conditions.push(eq(featureRequestsTable.category, query.category));
    if (query.search) conditions.push(ilike(featureRequestsTable.title, `%${query.search}%`));

    let orderBy;
    switch (query.sort) {
      case "votes": orderBy = desc(featureRequestsTable.votes); break;
      case "priority": orderBy = desc(featureRequestsTable.priority); break;
      default: orderBy = desc(featureRequestsTable.createdAt);
    }

    const featureRequests = await db
      .select()
      .from(featureRequestsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy);

    res.json(featureRequests);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/feature-requests", async (req, res) => {
  try {
    const body = CreateFeatureRequestBody.parse(req.body);
    const [featureRequest] = await db.insert(featureRequestsTable).values(body).returning();
    res.status(201).json(featureRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/feature-requests/export/json", async (req, res) => {
  try {
    const featureRequests = await db
      .select()
      .from(featureRequestsTable)
      .orderBy(desc(featureRequestsTable.votes));

    res.json({
      featureRequests,
      exportedAt: new Date().toISOString(),
      total: featureRequests.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/feature-requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [featureRequest] = await db.select().from(featureRequestsTable).where(eq(featureRequestsTable.id, id));
    if (!featureRequest) return res.status(404).json({ error: "Feature request not found" });
    res.json(featureRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/feature-requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateFeatureRequestBody.parse(req.body);
    const [featureRequest] = await db
      .update(featureRequestsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(featureRequestsTable.id, id))
      .returning();
    if (!featureRequest) return res.status(404).json({ error: "Feature request not found" });
    res.json(featureRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/feature-requests/:id/vote", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [featureRequest] = await db
      .update(featureRequestsTable)
      .set({ votes: sql`${featureRequestsTable.votes} + 1`, updatedAt: new Date() })
      .where(eq(featureRequestsTable.id, id))
      .returning();
    if (!featureRequest) return res.status(404).json({ error: "Feature request not found" });
    res.json(featureRequest);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/feature-requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(featureRequestsTable).where(eq(featureRequestsTable.id, id));
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
