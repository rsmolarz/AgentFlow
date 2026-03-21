import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { evalRunsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { ListEvalRunsQueryParams, CreateEvalRunBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/evaluations", async (req, res) => {
  try {
    const query = ListEvalRunsQueryParams.parse(req.query);
    let q = db.select().from(evalRunsTable);
    if (query.status) {
      q = q.where(eq(evalRunsTable.status, query.status)) as any;
    }
    const runs = await q.orderBy(desc(evalRunsTable.createdAt));
    res.json(runs.map(r => ({
      ...r,
      metrics: r.metrics || { accuracy: 0, relevance: 0, coherence: 0, safety: 0 },
    })));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/evaluations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [run] = await db.select().from(evalRunsTable).where(eq(evalRunsTable.id, id));
    if (!run) return res.status(404).json({ error: "Evaluation run not found" });
    res.json(run);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/evaluations", async (req, res) => {
  try {
    const body = CreateEvalRunBody.parse(req.body);
    const totalTests = Math.floor(Math.random() * 30) + 20;
    const passedTests = Math.floor(totalTests * (0.7 + Math.random() * 0.28));
    const failedTests = totalTests - passedTests;
    const score = (passedTests / totalTests) * 100;
    const status = score >= 90 ? "passed" : score >= 75 ? "warning" : "failed";
    const metrics = {
      accuracy: Math.floor(55 + Math.random() * 44),
      relevance: Math.floor(55 + Math.random() * 44),
      coherence: Math.floor(60 + Math.random() * 39),
      safety: Math.floor(85 + Math.random() * 14),
    };

    const [run] = await db.insert(evalRunsTable).values({
      name: body.name,
      agentId: body.agentId,
      agentName: body.agentName || "",
      status,
      score: Math.round(score * 10) / 10,
      totalTests,
      passedTests,
      failedTests,
      avgLatency: Math.round((0.5 + Math.random() * 5) * 10) / 10,
      tokenUsage: Math.floor(20000 + Math.random() * 100000),
      cost: Math.round((0.3 + Math.random() * 2) * 100) / 100,
      metrics,
    }).returning();

    res.status(201).json(run);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/evaluations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(evalRunsTable).where(eq(evalRunsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Evaluation run not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
