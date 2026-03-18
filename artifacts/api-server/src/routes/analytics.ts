import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable, workflowsTable, executionsTable } from "@workspace/db/schema";
import { eq, count, avg, sum, sql, gte } from "drizzle-orm";
import { GetAnalyticsOverviewQueryParams, GetExecutionStatsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "week":
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

router.get("/analytics/overview", async (req, res) => {
  try {
    const query = GetAnalyticsOverviewQueryParams.parse(req.query);
    const periodStart = getPeriodStart(query.period || "week");

    const [agentStats] = await db
      .select({
        total: count(),
        active: count(sql`CASE WHEN ${agentsTable.status} = 'active' THEN 1 END`),
      })
      .from(agentsTable);

    const [workflowStats] = await db
      .select({
        total: count(),
        active: count(sql`CASE WHEN ${workflowsTable.status} = 'active' THEN 1 END`),
      })
      .from(workflowsTable);

    const [execStats] = await db
      .select({
        total: count(),
        successful: count(sql`CASE WHEN ${executionsTable.status} = 'completed' THEN 1 END`),
        failed: count(sql`CASE WHEN ${executionsTable.status} = 'failed' THEN 1 END`),
        avgTime: avg(executionsTable.duration),
        totalTokens: sum(executionsTable.tokensUsed),
        totalCost: sum(executionsTable.cost),
      })
      .from(executionsTable);

    const [periodExecStats] = await db
      .select({
        total: count(),
        successful: count(sql`CASE WHEN ${executionsTable.status} = 'completed' THEN 1 END`),
      })
      .from(executionsTable)
      .where(gte(executionsTable.createdAt, periodStart));

    const previousPeriodStart = new Date(periodStart.getTime() - (new Date().getTime() - periodStart.getTime()));
    const [prevPeriodStats] = await db
      .select({
        total: count(),
        successful: count(sql`CASE WHEN ${executionsTable.status} = 'completed' THEN 1 END`),
      })
      .from(executionsTable)
      .where(
        sql`${executionsTable.createdAt} >= ${previousPeriodStart} AND ${executionsTable.createdAt} < ${periodStart}`
      );

    const executionTrend = prevPeriodStats.total > 0
      ? ((periodExecStats.total - prevPeriodStats.total) / prevPeriodStats.total) * 100
      : 0;

    const currentSuccessRate = periodExecStats.total > 0 ? (periodExecStats.successful / periodExecStats.total) * 100 : 0;
    const prevSuccessRate = prevPeriodStats.total > 0 ? (prevPeriodStats.successful / prevPeriodStats.total) * 100 : 0;
    const successRateTrend = prevSuccessRate > 0 ? currentSuccessRate - prevSuccessRate : 0;

    res.json({
      totalAgents: agentStats.total,
      activeAgents: agentStats.active,
      totalWorkflows: workflowStats.total,
      activeWorkflows: workflowStats.active,
      totalExecutions: execStats.total,
      successfulExecutions: execStats.successful,
      failedExecutions: execStats.failed,
      avgExecutionTime: Number(execStats.avgTime) || 0,
      totalTokensUsed: Number(execStats.totalTokens) || 0,
      totalCost: Number(execStats.totalCost) || 0,
      executionTrend: Math.round(executionTrend * 10) / 10,
      successRateTrend: Math.round(successRateTrend * 10) / 10,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/analytics/execution-stats", async (req, res) => {
  try {
    const query = GetExecutionStatsQueryParams.parse(req.query);
    const periodStart = getPeriodStart(query.period || "week");

    const stats = await db
      .select({
        date: sql<string>`DATE(${executionsTable.createdAt})`,
        total: count(),
        successful: count(sql`CASE WHEN ${executionsTable.status} = 'completed' THEN 1 END`),
        failed: count(sql`CASE WHEN ${executionsTable.status} = 'failed' THEN 1 END`),
        avgDuration: avg(executionsTable.duration),
        tokensUsed: sum(executionsTable.tokensUsed),
      })
      .from(executionsTable)
      .where(gte(executionsTable.createdAt, periodStart))
      .groupBy(sql`DATE(${executionsTable.createdAt})`)
      .orderBy(sql`DATE(${executionsTable.createdAt})`);

    res.json(
      stats.map((s) => ({
        date: String(s.date),
        total: s.total,
        successful: s.successful,
        failed: s.failed,
        avgDuration: Number(s.avgDuration) || 0,
        tokensUsed: Number(s.tokensUsed) || 0,
      }))
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
