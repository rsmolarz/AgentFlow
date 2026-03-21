import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { costAlertsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/cost-alerts", async (_req, res) => {
  try {
    const alerts = await db.select().from(costAlertsTable).orderBy(costAlertsTable.createdAt);
    res.json(alerts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/cost-alerts", async (req, res) => {
  try {
    const { name, budgetAmount, alertThreshold, alertType, notifyEmail, notifyInApp, resetDay } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    if (!budgetAmount || Number(budgetAmount) <= 0) return res.status(400).json({ error: "Budget amount must be positive" });

    const simulatedSpend = (Math.random() * Number(budgetAmount) * 0.9).toFixed(2);

    const [alert] = await db.insert(costAlertsTable).values({
      name: name.trim(),
      budgetAmount: String(budgetAmount),
      currentSpend: simulatedSpend,
      alertThreshold: alertThreshold || 80,
      alertType: alertType || "monthly",
      notifyEmail: notifyEmail !== false,
      notifyInApp: notifyInApp !== false,
      resetDay: resetDay || 1,
    }).returning();

    const pct = (Number(alert.currentSpend) / Number(alert.budgetAmount)) * 100;
    const triggered = pct >= (alert.alertThreshold || 80);
    if (triggered) {
      await db.update(costAlertsTable).set({
        triggered: true,
        triggeredAt: new Date(),
      }).where(eq(costAlertsTable.id, alert.id));
      alert.triggered = true;
      alert.triggeredAt = new Date();
    }

    res.status(201).json(alert);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/cost-alerts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, budgetAmount, alertThreshold, enabled, notifyEmail, notifyInApp, resetDay } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (budgetAmount !== undefined) updates.budgetAmount = String(budgetAmount);
    if (alertThreshold !== undefined) updates.alertThreshold = alertThreshold;
    if (enabled !== undefined) updates.enabled = enabled;
    if (notifyEmail !== undefined) updates.notifyEmail = notifyEmail;
    if (notifyInApp !== undefined) updates.notifyInApp = notifyInApp;
    if (resetDay !== undefined) updates.resetDay = resetDay;

    const [alert] = await db
      .update(costAlertsTable)
      .set(updates)
      .where(eq(costAlertsTable.id, id))
      .returning();

    if (!alert) return res.status(404).json({ error: "Cost alert not found" });
    res.json(alert);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/cost-alerts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(costAlertsTable).where(eq(costAlertsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Cost alert not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/cost-alerts/:id/reset", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [alert] = await db
      .update(costAlertsTable)
      .set({ currentSpend: "0", triggered: false, triggeredAt: null, updatedAt: new Date() })
      .where(eq(costAlertsTable.id, id))
      .returning();
    if (!alert) return res.status(404).json({ error: "Cost alert not found" });
    res.json(alert);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
