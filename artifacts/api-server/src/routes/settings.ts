import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { ListSettingsQueryParams, UpsertSettingBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", async (req, res) => {
  try {
    const query = ListSettingsQueryParams.parse(req.query);
    let q = db.select().from(settingsTable);
    if (query.category) {
      q = q.where(eq(settingsTable.category, query.category)) as any;
    }
    const settings = await q.orderBy(settingsTable.key);
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const body = UpsertSettingBody.parse(req.body);
    const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, body.key));
    let setting;
    if (existing) {
      [setting] = await db.update(settingsTable)
        .set({ value: body.value, category: body.category || existing.category, updatedAt: new Date() })
        .where(eq(settingsTable.key, body.key))
        .returning();
    } else {
      [setting] = await db.insert(settingsTable)
        .values({ key: body.key, value: body.value, category: body.category || "general" })
        .returning();
    }
    res.json(setting);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/settings/:key", async (req, res) => {
  try {
    const [setting] = await db.select().from(settingsTable).where(eq(settingsTable.key, req.params.key));
    if (!setting) return res.status(404).json({ error: "Setting not found" });
    res.json(setting);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/settings/:key", async (req, res) => {
  try {
    const [deleted] = await db.delete(settingsTable).where(eq(settingsTable.key, req.params.key)).returning();
    if (!deleted) return res.status(404).json({ error: "Setting not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
