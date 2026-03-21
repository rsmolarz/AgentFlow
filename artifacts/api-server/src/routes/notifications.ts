import { Router } from "express";
import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const router = Router();

router.get("/notifications", async (_req, res) => {
  try {
    const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

router.get("/notifications/unread-count", async (_req, res) => {
  try {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.read, false));
    res.json({ count: Number(result.count) });
  } catch (err) {
    res.json({ count: 0 });
  }
});

router.put("/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

router.put("/notifications/read-all", async (_req, res) => {
  try {
    await db.update(notifications).set({ read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(notifications).where(eq(notifications.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
