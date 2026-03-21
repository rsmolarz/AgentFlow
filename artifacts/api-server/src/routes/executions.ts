import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { executionsTable, executionLogsTable, workflowsTable, bulkExecutionsTable } from "@workspace/db/schema";
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

router.post("/executions/:executionId/replay", async (req, res) => {
  try {
    const executionId = Number(req.params.executionId);
    const [original] = await db.select().from(executionsTable).where(eq(executionsTable.id, executionId));
    if (!original) return res.status(404).json({ error: "Execution not found" });

    const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, original.workflowId));
    if (!workflow) return res.status(404).json({ error: "Original workflow not found" });

    const nodeCount = workflow.definition?.nodes?.length || 0;

    const [execution] = await db
      .insert(executionsTable)
      .values({
        workflowId: workflow.id,
        workflowName: workflow.name,
        status: "running",
        inputData: original.inputData || {},
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
      .where(eq(workflowsTable.id, workflow.id));

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

    res.status(201).json({ ...execution, replayOf: executionId });
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

router.get("/executions/:executionId/logs/stream", async (req, res) => {
  try {
    const executionId = Number(req.params.executionId);
    if (isNaN(executionId)) return res.status(400).json({ error: "Invalid execution ID" });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    let lastLogCount = 0;
    let lastStatus = "";

    const sendUpdate = async () => {
      const logs = await db
        .select()
        .from(executionLogsTable)
        .where(eq(executionLogsTable.executionId, executionId))
        .orderBy(executionLogsTable.id);

      const [execution] = await db
        .select()
        .from(executionsTable)
        .where(eq(executionsTable.id, executionId));

      const completedLogs = logs.filter(l => l.status !== "pending");

      if (completedLogs.length !== lastLogCount || execution?.status !== lastStatus) {
        lastLogCount = completedLogs.length;
        lastStatus = execution?.status || "";

        res.write(
          `data: ${JSON.stringify({
            logs: completedLogs,
            execution: execution
              ? { status: execution.status, completedSteps: execution.completedSteps, totalSteps: execution.totalSteps, currentStep: execution.currentStep }
              : null,
          })}\n\n`
        );
      }

      if (execution?.status === "completed" || execution?.status === "failed") {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return true;
      }
      return false;
    };

    await sendUpdate();

    const interval = setInterval(async () => {
      try {
        const done = await sendUpdate();
        if (done) clearInterval(interval);
      } catch {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on("close", () => {
      clearInterval(interval);
    });
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(400).json({ error: error.message });
    }
  }
});

router.post("/workflows/:workflowId/bulk-run", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const { rows, headers } = req.body as { rows: Record<string, any>[]; headers: string[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided" });
    }
    if (rows.length > 500) {
      return res.status(400).json({ error: "Maximum 500 rows per bulk execution" });
    }

    const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });

    const [bulkExec] = await db
      .insert(bulkExecutionsTable)
      .values({
        workflowId,
        workflowName: workflow.name,
        status: "running",
        totalRows: rows.length,
        completedRows: 0,
        failedRows: 0,
        headers: headers || [],
        results: [],
        startedAt: new Date(),
      })
      .returning();

    processBulkExecution(bulkExec.id, workflowId, workflow, rows);

    res.status(201).json(bulkExec);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

async function processBulkExecution(
  bulkId: number,
  workflowId: number,
  workflow: any,
  rows: Record<string, any>[]
) {
  const results: any[] = [];
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowStart = Date.now();
    try {
      const nodes = workflow.definition?.nodes || [];
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 800));

      const rowFailed = Math.random() < 0.05;
      const duration = (Date.now() - rowStart) / 1000;

      if (rowFailed) {
        failed++;
        results.push({
          row: i + 1,
          status: "failed",
          input: rows[i],
          error: "Simulated processing error",
          duration,
        });
      } else {
        completed++;
        results.push({
          row: i + 1,
          status: "completed",
          input: rows[i],
          output: {
            result: `Processed row ${i + 1} through ${nodes.length} nodes`,
            processedFields: Object.keys(rows[i]),
          },
          duration,
        });
      }

      await db
        .update(bulkExecutionsTable)
        .set({
          completedRows: completed,
          failedRows: failed,
          results,
        })
        .where(eq(bulkExecutionsTable.id, bulkId));
    } catch (err) {
      failed++;
      results.push({
        row: i + 1,
        status: "failed",
        input: rows[i],
        error: String(err),
        duration: (Date.now() - rowStart) / 1000,
      });
    }
  }

  const endTime = new Date();
  const [exec] = await db.select().from(bulkExecutionsTable).where(eq(bulkExecutionsTable.id, bulkId));
  const duration = exec?.startedAt ? (endTime.getTime() - exec.startedAt.getTime()) / 1000 : 0;

  await db
    .update(bulkExecutionsTable)
    .set({
      status: "completed",
      completedRows: completed,
      failedRows: failed,
      results,
      completedAt: endTime,
      duration,
    })
    .where(eq(bulkExecutionsTable.id, bulkId));
}

router.get("/bulk-executions", async (req, res) => {
  try {
    const workflowId = req.query.workflowId ? Number(req.query.workflowId) : undefined;
    const conditions = [];
    if (workflowId) conditions.push(eq(bulkExecutionsTable.workflowId, workflowId));

    const items = await db
      .select()
      .from(bulkExecutionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bulkExecutionsTable.createdAt))
      .limit(50);

    res.json(items);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/bulk-executions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [exec] = await db.select().from(bulkExecutionsTable).where(eq(bulkExecutionsTable.id, id));
    if (!exec) return res.status(404).json({ error: "Bulk execution not found" });
    res.json(exec);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/bulk-executions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(bulkExecutionsTable).where(eq(bulkExecutionsTable.id, id));
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
