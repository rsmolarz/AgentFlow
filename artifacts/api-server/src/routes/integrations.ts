import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { integrationsTable } from "@workspace/db/schema";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { ListIntegrationsQueryParams, ConnectIntegrationBody, DisconnectIntegrationBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/integrations", async (req, res) => {
  try {
    const query = ListIntegrationsQueryParams.parse(req.query);
    const conditions = [];
    if (query.category) conditions.push(eq(integrationsTable.category, query.category));
    if (query.search) conditions.push(ilike(integrationsTable.name, `%${query.search}%`));
    if (query.connected === "true") conditions.push(eq(integrationsTable.connected, true));
    if (query.connected === "false") conditions.push(eq(integrationsTable.connected, false));

    const integrations = await db
      .select({
        id: integrationsTable.id,
        name: integrationsTable.name,
        category: integrationsTable.category,
        description: integrationsTable.description,
        icon: integrationsTable.icon,
        connected: integrationsTable.connected,
        popular: integrationsTable.popular,
        nodes: integrationsTable.nodes,
        createdAt: integrationsTable.createdAt,
        updatedAt: integrationsTable.updatedAt,
      })
      .from(integrationsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(integrationsTable.connected), integrationsTable.name);

    res.json(integrations);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/integrations/connect", async (req, res) => {
  try {
    const body = ConnectIntegrationBody.parse(req.body);
    const [existing] = await db.select().from(integrationsTable).where(eq(integrationsTable.name, body.name));
    if (!existing) {
      return res.status(404).json({ error: `Integration "${body.name}" not found` });
    }
    const maskedKey = body.apiKey.slice(0, 6) + "..." + body.apiKey.slice(-4);
    const [updated] = await db.update(integrationsTable)
      .set({ connected: true, apiKey: maskedKey, updatedAt: new Date() })
      .where(eq(integrationsTable.name, body.name))
      .returning();
    res.json({ ...updated, apiKey: undefined });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/integrations/disconnect", async (req, res) => {
  try {
    const body = DisconnectIntegrationBody.parse(req.body);
    const [updated] = await db.update(integrationsTable)
      .set({ connected: false, apiKey: null, updatedAt: new Date() })
      .where(eq(integrationsTable.name, body.name))
      .returning();
    if (!updated) return res.status(404).json({ error: `Integration "${body.name}" not found` });
    res.json({ ...updated, apiKey: undefined });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
