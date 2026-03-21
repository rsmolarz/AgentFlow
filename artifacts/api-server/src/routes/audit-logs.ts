import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const router = Router();

router.get("/audit-logs", async (req, res) => {
  try {
    const entityType = req.query.entityType as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    let query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
    if (entityType) {
      query = db.select().from(auditLogs).where(eq(auditLogs.entityType, entityType)).orderBy(desc(auditLogs.createdAt)).limit(limit);
    }
    const rows = await query;
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

router.get("/audit-logs/stats", async (_req, res) => {
  try {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
    const [today] = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(sql`created_at > NOW() - INTERVAL '24 hours'`);
    res.json({ total: Number(total.count), today: Number(today.count) });
  } catch (err) {
    res.json({ total: 0, today: 0 });
  }
});

export default router;
