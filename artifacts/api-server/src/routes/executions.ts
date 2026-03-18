import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { executionsTable, executionLogsTable, workflowsTable } from "@workspace/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import {
  RunWorkflowBody,
  RunWorkflowParams,
  ListExecutionsQueryParams,
  GetExecutionParams,
  CancelExecutionParams,
  GetExecutionLogsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/workflows/:workflowId/run", async (req, res) => {
  try {
    const { workflowId } = RunWorkflowParams.parse(req.params);
    const body = RunWorkflowBody.parse(req.body);

    const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });

    const nodeCount = workflow.definition?.nodes?.length || 0;

    const [execution] = await db
      .insert(executionsTable)
      .values({
        workflowId,
        workflowName: workflow.name,
        status: "running",
        inputData: body.inputData || {},
        startedAt: new Date(),
        totalSteps: nodeCount,
        completedSteps: 0,
        currentStep: workflow.definition?.nodes?.[0]?.label || "Starting",
      })
      .returning();

    await db
      .update(workflowsTable)
      .set({
        lastRunAt: new Date(),
        executionCount: sql`${workflowsTable.executionCount} + 1`,
      })
      .where(eq(workflowsTable.id, workflowId));

    const nodes = workflow.definition?.nodes || [];
    for (const node of nodes) {
      await db.insert(executionLogsTable).values({
        executionId: execution.id,
        nodeId: node.id,
        nodeName: node.label,
        nodeType: node.type,
        status: "pending",
      });
    }

    simulateExecution(execution.id, nodes);

    res.status(201).json(execution);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

async function simulateExecution(executionId: number, nodes: any[]) {
  try {
    let totalTokens = 0;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const stepStart = new Date();

      await db
        .update(executionLogsTable)
        .set({ status: "running", startedAt: stepStart })
        .where(
          and(
            eq(executionLogsTable.executionId, executionId),
            eq(executionLogsTable.nodeId, node.id)
          )
        );

      await db
        .update(executionsTable)
        .set({ currentStep: node.label, completedSteps: i })
        .where(eq(executionsTable.id, executionId));

      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1500));

      const stepEnd = new Date();
      const stepDuration = (stepEnd.getTime() - stepStart.getTime()) / 1000;
      const stepTokens = Math.floor(Math.random() * 500) + 100;
      totalTokens += stepTokens;

      const failed = Math.random() < 0.05;

      await db
        .update(executionLogsTable)
        .set({
          status: failed ? "failed" : "completed",
          completedAt: stepEnd,
          duration: stepDuration,
          tokensUsed: stepTokens,
          output: failed ? undefined : { result: `Processed by ${node.label}` },
          error: failed ? "Simulated failure" : undefined,
        })
        .where(
          and(
            eq(executionLogsTable.executionId, executionId),
            eq(executionLogsTable.nodeId, node.id)
          )
        );

      if (failed) {
        await db
          .update(executionsTable)
          .set({
            status: "failed",
            error: `Step "${node.label}" failed`,
            completedAt: stepEnd,
            duration: (stepEnd.getTime() - stepStart.getTime()) / 1000,
            tokensUsed: totalTokens,
            completedSteps: i + 1,
          })
          .where(eq(executionsTable.id, executionId));
        return;
      }
    }

    const endTime = new Date();
    const [exec] = await db.select().from(executionsTable).where(eq(executionsTable.id, executionId));
    const duration = exec?.startedAt ? (endTime.getTime() - exec.startedAt.getTime()) / 1000 : 0;

    await db
      .update(executionsTable)
      .set({
        status: "completed",
        completedAt: endTime,
        duration,
        tokensUsed: totalTokens,
        cost: totalTokens * 0.00003,
        completedSteps: nodes.length,
        currentStep: "Done",
        outputData: { result: "Workflow completed successfully" },
      })
      .where(eq(executionsTable.id, executionId));
  } catch (err) {
    await db
      .update(executionsTable)
      .set({ status: "failed", error: String(err) })
      .where(eq(executionsTable.id, executionId));
  }
}

router.get("/executions", async (req, res) => {
  try {
    const query = ListExecutionsQueryParams.parse(req.query);
    const conditions = [];
    if (query.workflowId) conditions.push(eq(executionsTable.workflowId, query.workflowId));
    if (query.status) conditions.push(eq(executionsTable.status, query.status));

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(executionsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(executionsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(executionsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    res.json({
      items,
      total: totalResult[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/executions/:executionId", async (req, res) => {
  try {
    const { executionId } = GetExecutionParams.parse(req.params);
    const [execution] = await db.select().from(executionsTable).where(eq(executionsTable.id, executionId));
    if (!execution) return res.status(404).json({ error: "Execution not found" });
    res.json(execution);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/executions/:executionId/cancel", async (req, res) => {
  try {
    const { executionId } = CancelExecutionParams.parse(req.params);
    const [execution] = await db
      .update(executionsTable)
      .set({ status: "cancelled", completedAt: new Date() })
      .where(eq(executionsTable.id, executionId))
      .returning();
    if (!execution) return res.status(404).json({ error: "Execution not found" });
    res.json(execution);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/executions/:executionId/logs", async (req, res) => {
  try {
    const { executionId } = GetExecutionLogsParams.parse(req.params);
    const logs = await db
      .select()
      .from(executionLogsTable)
      .where(eq(executionLogsTable.executionId, executionId))
      .orderBy(executionLogsTable.id);
    res.json(logs);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
