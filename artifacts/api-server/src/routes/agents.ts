import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  CreateAgentBody,
  UpdateAgentBody,
  ListAgentsQueryParams,
  GetAgentParams,
  UpdateAgentParams,
  DeleteAgentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/agents", async (req, res) => {
  try {
    const query = ListAgentsQueryParams.parse(req.query);
    const conditions = [];
    if (query.status) conditions.push(eq(agentsTable.status, query.status));
    if (query.search) conditions.push(ilike(agentsTable.name, `%${query.search}%`));

    const agents = await db
      .select()
      .from(agentsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(agentsTable.createdAt);

    res.json(agents);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/agents", async (req, res) => {
  try {
    const body = CreateAgentBody.parse(req.body);
    const [agent] = await db.insert(agentsTable).values(body).returning();
    res.status(201).json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/agents/:agentId", async (req, res) => {
  try {
    const { agentId } = GetAgentParams.parse(req.params);
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId));
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/agents/:agentId", async (req, res) => {
  try {
    const { agentId } = UpdateAgentParams.parse(req.params);
    const body = UpdateAgentBody.parse(req.body);
    const [agent] = await db
      .update(agentsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(agentsTable.id, agentId))
      .returning();
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/agents/:agentId", async (req, res) => {
  try {
    const { agentId } = DeleteAgentParams.parse(req.params);
    await db.delete(agentsTable).where(eq(agentsTable.id, agentId));
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
