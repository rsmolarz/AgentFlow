import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workflowsTable, workflowVersionsTable } from "@workspace/db/schema";
import { eq, ilike, and, desc, sql, count } from "drizzle-orm";
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

    if (body.definition) {
      const [current] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
      if (current && current.definition) {
        const [maxVersion] = await db
          .select({ max: sql<number>`COALESCE(MAX(${workflowVersionsTable.version}), 0)` })
          .from(workflowVersionsTable)
          .where(eq(workflowVersionsTable.workflowId, workflowId));
        const nextVersion = (maxVersion?.max || 0) + 1;
        const def = current.definition as { nodes: any[]; edges: any[] };
        await db.insert(workflowVersionsTable).values({
          workflowId,
          version: nextVersion,
          label: `v${nextVersion}`,
          definition: current.definition,
          nodeCount: def.nodes?.length || 0,
          edgeCount: def.edges?.length || 0,
        });
      }
    }

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

router.get("/workflows/:workflowId/versions", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const versions = await db
      .select()
      .from(workflowVersionsTable)
      .where(eq(workflowVersionsTable.workflowId, workflowId))
      .orderBy(desc(workflowVersionsTable.version));
    res.json(versions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/workflows/:workflowId/versions/:versionId", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const versionId = Number(req.params.versionId);
    const [version] = await db
      .select()
      .from(workflowVersionsTable)
      .where(and(eq(workflowVersionsTable.id, versionId), eq(workflowVersionsTable.workflowId, workflowId)));
    if (!version) return res.status(404).json({ error: "Version not found" });
    res.json(version);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/workflows/:workflowId/versions/:versionId/restore", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const versionId = Number(req.params.versionId);

    const [version] = await db
      .select()
      .from(workflowVersionsTable)
      .where(and(eq(workflowVersionsTable.id, versionId), eq(workflowVersionsTable.workflowId, workflowId)));
    if (!version) return res.status(404).json({ error: "Version not found" });

    const [current] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
    if (current && current.definition) {
      const [maxVersion] = await db
        .select({ max: sql<number>`COALESCE(MAX(${workflowVersionsTable.version}), 0)` })
        .from(workflowVersionsTable)
        .where(eq(workflowVersionsTable.workflowId, workflowId));
      const nextVersion = (maxVersion?.max || 0) + 1;
      const def = current.definition as { nodes: any[]; edges: any[] };
      await db.insert(workflowVersionsTable).values({
        workflowId,
        version: nextVersion,
        label: `v${nextVersion} (before restore)`,
        definition: current.definition,
        nodeCount: def.nodes?.length || 0,
        edgeCount: def.edges?.length || 0,
      });
    }

    const [workflow] = await db
      .update(workflowsTable)
      .set({ definition: version.definition, updatedAt: new Date() })
      .where(eq(workflowsTable.id, workflowId))
      .returning();

    res.json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/workflows/:workflowId/versions/:versionId", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const versionId = Number(req.params.versionId);
    const { label } = req.body;
    const [version] = await db
      .update(workflowVersionsTable)
      .set({ label: label || "" })
      .where(and(eq(workflowVersionsTable.id, versionId), eq(workflowVersionsTable.workflowId, workflowId)))
      .returning();
    if (!version) return res.status(404).json({ error: "Version not found" });
    res.json(version);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/workflows/:workflowId/suggestions", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });

    const def = workflow.definition as { nodes: any[]; edges: any[] };
    const nodesSummary = (def.nodes || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      label: n.data?.label || n.type,
      config: {
        ...(n.data?.agentId ? { agentId: n.data.agentId } : {}),
        ...(n.data?.triggerType ? { triggerType: n.data.triggerType } : {}),
        ...(n.data?.conditionType ? { conditionType: n.data.conditionType } : {}),
        ...(n.data?.code ? { hasCode: true } : {}),
      },
    }));
    const edgesSummary = (def.edges || []).map((e: any) => ({
      from: e.source,
      to: e.target,
      label: e.sourceHandle || "",
    }));

    const { openai } = await import("@workspace/integrations-openai-ai-server");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert workflow optimization consultant for an AI agent automation platform. Analyze the given workflow and provide actionable suggestions to improve it.

Your suggestions should cover these categories:
- PERFORMANCE: Speed optimizations, parallelization opportunities
- RELIABILITY: Error handling, retry logic, fallback paths
- COST: Token usage reduction, model selection optimization
- STRUCTURE: Architecture improvements, node organization
- BEST_PRACTICES: Industry standards, common patterns

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "category": "PERFORMANCE|RELIABILITY|COST|STRUCTURE|BEST_PRACTICES",
      "title": "Short title",
      "description": "Detailed explanation of the suggestion",
      "impact": "high|medium|low",
      "nodeIds": ["affected-node-ids"]
    }
  ],
  "overallScore": 75,
  "summary": "Brief overall assessment of the workflow"
}`
        },
        {
          role: "user",
          content: `Analyze this workflow named "${workflow.name}" (${workflow.description || "no description"}):

Nodes (${nodesSummary.length}):
${JSON.stringify(nodesSummary, null, 2)}

Edges (${edgesSummary.length}):
${JSON.stringify(edgesSummary, null, 2)}

Status: ${workflow.status}
Execution count: ${workflow.executionCount}
Success rate: ${workflow.successRate}%
Average duration: ${workflow.avgDuration}s

Provide optimization suggestions.`
        },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = {
        suggestions: [{ category: "BEST_PRACTICES", title: "Analysis complete", description: text, impact: "medium", nodeIds: [] }],
        overallScore: 70,
        summary: "Analysis completed but could not be structured.",
      };
    }

    res.json({
      ...parsed,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    });
  } catch (error: any) {
    console.error("Workflow suggestions error:", error);
    res.status(500).json({ error: error.message || "Failed to generate suggestions" });
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
