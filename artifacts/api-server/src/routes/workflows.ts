import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workflowsTable } from "@workspace/db/schema";
import { eq, ilike, and } from "drizzle-orm";
import {
  CreateWorkflowBody,
  UpdateWorkflowBody,
  ListWorkflowsQueryParams,
  GetWorkflowParams,
  UpdateWorkflowParams,
  DeleteWorkflowParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workflows", async (req, res) => {
  try {
    const query = ListWorkflowsQueryParams.parse(req.query);
    const conditions = [];
    if (query.status) conditions.push(eq(workflowsTable.status, query.status));
    if (query.search) conditions.push(ilike(workflowsTable.name, `%${query.search}%`));

    const workflows = await db
      .select()
      .from(workflowsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(workflowsTable.createdAt);

    res.json(workflows);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/workflows", async (req, res) => {
  try {
    const body = CreateWorkflowBody.parse(req.body);
    const [workflow] = await db.insert(workflowsTable).values(body).returning();
    res.status(201).json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = GetWorkflowParams.parse(req.params);
    const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    res.json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = UpdateWorkflowParams.parse(req.params);
    const body = UpdateWorkflowBody.parse(req.body);
    const [workflow] = await db
      .update(workflowsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(workflowsTable.id, workflowId))
      .returning();
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    res.json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/workflows/:workflowId", async (req, res) => {
  try {
    const { workflowId } = DeleteWorkflowParams.parse(req.params);
    await db.delete(workflowsTable).where(eq(workflowsTable.id, workflowId));
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
