import { Router } from "express";
import { db } from "@workspace/db";
import { agentPresets } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/agent-presets", async (_req, res) => {
  try {
    const rows = await db.select().from(agentPresets).orderBy(desc(agentPresets.createdAt));
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

router.get("/agent-presets/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [preset] = await db.select().from(agentPresets).where(eq(agentPresets.id, id));
    if (!preset) return res.status(404).json({ error: "Preset not found" });
    res.json(preset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch preset" });
  }
});

router.post("/agent-presets", async (req, res) => {
  try {
    const { name, role, description, icon, category, systemPrompt, model, tools, config } = req.body;
    const [preset] = await db.insert(agentPresets).values({
      name, role, description, icon, category, systemPrompt, model, tools, config, builtin: false
    }).returning();
    res.json(preset);
  } catch (err) {
    res.status(500).json({ error: "Failed to create preset" });
  }
});

router.delete("/agent-presets/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(agentPresets).where(eq(agentPresets.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete preset" });
  }
});

export default router;
