import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workflowSchedulesTable, workflowsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function parseCronLabel(cron: string): string {
  const presets: Record<string, string> = {
    "* * * * *": "Every minute",
    "*/5 * * * *": "Every 5 minutes",
    "*/15 * * * *": "Every 15 minutes",
    "*/30 * * * *": "Every 30 minutes",
    "0 * * * *": "Every hour",
    "0 */2 * * *": "Every 2 hours",
    "0 */6 * * *": "Every 6 hours",
    "0 */12 * * *": "Every 12 hours",
    "0 0 * * *": "Daily at midnight",
    "0 9 * * *": "Daily at 9:00 AM",
    "0 9 * * 1-5": "Weekdays at 9:00 AM",
    "0 0 * * 0": "Weekly on Sunday",
    "0 0 * * 1": "Weekly on Monday",
    "0 0 1 * *": "Monthly on the 1st",
  };
  return presets[cron] || cron;
}

function getNextRunFromCron(cron: string): Date {
  const now = new Date();
  const parts = cron.split(/\s+/);
  if (parts.length !== 5) return new Date(now.getTime() + 3600000);

  const [minPart, hourPart] = parts;
  const next = new Date(now);

  if (minPart.startsWith("*/")) {
    const interval = parseInt(minPart.slice(2)) || 5;
    const nextMin = Math.ceil((now.getMinutes() + 1) / interval) * interval;
    if (nextMin >= 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(nextMin - 60);
    } else {
      next.setMinutes(nextMin);
    }
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
  }

  if (minPart === "0" && hourPart === "*") {
    next.setHours(next.getHours() + 1);
    next.setMinutes(0);
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
  }

  if (minPart === "0" && hourPart.startsWith("*/")) {
    const interval = parseInt(hourPart.slice(2)) || 1;
    const nextHour = Math.ceil((now.getHours() + 1) / interval) * interval;
    if (nextHour >= 24) {
      next.setDate(next.getDate() + 1);
      next.setHours(nextHour - 24);
    } else {
      next.setHours(nextHour);
    }
    next.setMinutes(0);
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
  }

  const targetMin = parseInt(minPart) || 0;
  const targetHour = parseInt(hourPart) || 0;
  next.setHours(targetHour, targetMin, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

router.get("/workflows/:workflowId/schedules", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const schedules = await db
      .select()
      .from(workflowSchedulesTable)
      .where(eq(workflowSchedulesTable.workflowId, workflowId));
    res.json(schedules);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/workflows/:workflowId/schedules", async (req, res) => {
  try {
    const workflowId = Number(req.params.workflowId);
    const [workflow] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId));
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });

    const { cronExpression, timezone, label, enabled } = req.body;
    if (!cronExpression || !cronExpression.trim()) {
      return res.status(400).json({ error: "Cron expression is required" });
    }

    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      return res.status(400).json({ error: "Invalid cron expression. Must have 5 fields: minute hour day month weekday" });
    }

    const nextRunAt = getNextRunFromCron(cronExpression.trim());
    const resolvedLabel = label || parseCronLabel(cronExpression.trim());

    const [schedule] = await db.insert(workflowSchedulesTable).values({
      workflowId,
      cronExpression: cronExpression.trim(),
      timezone: timezone || "UTC",
      enabled: enabled !== false,
      label: resolvedLabel,
      nextRunAt,
    }).returning();

    res.status(201).json(schedule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/schedules/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { cronExpression, timezone, label, enabled } = req.body;
    const updates: any = { updatedAt: new Date() };

    if (cronExpression !== undefined) {
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length !== 5) {
        return res.status(400).json({ error: "Invalid cron expression" });
      }
      updates.cronExpression = cronExpression.trim();
      updates.nextRunAt = getNextRunFromCron(cronExpression.trim());
    }
    if (timezone !== undefined) updates.timezone = timezone;
    if (label !== undefined) updates.label = label;
    if (enabled !== undefined) updates.enabled = enabled;

    const [schedule] = await db
      .update(workflowSchedulesTable)
      .set(updates)
      .where(eq(workflowSchedulesTable.id, id))
      .returning();

    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    res.json(schedule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/schedules/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db
      .delete(workflowSchedulesTable)
      .where(eq(workflowSchedulesTable.id, id))
      .returning();
    if (!deleted) return res.status(404).json({ error: "Schedule not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/schedules", async (req, res) => {
  try {
    const schedules = await db.select().from(workflowSchedulesTable);
    res.json(schedules);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
