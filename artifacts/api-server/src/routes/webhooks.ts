import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { webhooksTable, workflowsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function generateSlug(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("base64url")}`;
}

router.get("/webhooks", async (_req, res) => {
  try {
    const webhooks = await db.select().from(webhooksTable).orderBy(webhooksTable.createdAt);
    const workflows = await db.select({ id: workflowsTable.id, name: workflowsTable.name }).from(workflowsTable);
    const workflowMap = Object.fromEntries(workflows.map(w => [w.id, w.name]));
    const enriched = webhooks.map(wh => ({
      ...wh,
      workflowName: wh.workflowId ? workflowMap[wh.workflowId] || null : null,
    }));
    res.json(enriched);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/webhooks", async (req, res) => {
  try {
    const { name, workflowId, method, description, enabled } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const slug = generateSlug();
    const secret = generateSecret();

    const [webhook] = await db.insert(webhooksTable).values({
      name: name.trim(),
      slug,
      workflowId: workflowId ? Number(workflowId) : null,
      method: method || "POST",
      description: description || "",
      enabled: enabled !== false,
      secret,
    }).returning();

    res.status(201).json(webhook);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/webhooks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, workflowId, method, description, enabled } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (workflowId !== undefined) updates.workflowId = workflowId ? Number(workflowId) : null;
    if (method !== undefined) updates.method = method;
    if (description !== undefined) updates.description = description;
    if (enabled !== undefined) updates.enabled = enabled;

    const [webhook] = await db
      .update(webhooksTable)
      .set(updates)
      .where(eq(webhooksTable.id, id))
      .returning();

    if (!webhook) return res.status(404).json({ error: "Webhook not found" });
    res.json(webhook);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/webhooks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(webhooksTable).where(eq(webhooksTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Webhook not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/webhooks/:id/regenerate-secret", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const newSecret = generateSecret();
    const [webhook] = await db
      .update(webhooksTable)
      .set({ secret: newSecret, updatedAt: new Date() })
      .where(eq(webhooksTable.id, id))
      .returning();
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });
    res.json(webhook);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/webhooks/:id/test", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [webhook] = await db.select().from(webhooksTable).where(eq(webhooksTable.id, id));
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });

    const testPayload = { event: "test", timestamp: new Date().toISOString(), data: { message: "Test webhook call" } };

    await db.update(webhooksTable).set({
      lastCalledAt: new Date(),
      callCount: (webhook.callCount || 0) + 1,
      lastPayload: testPayload,
      lastStatus: "success",
      updatedAt: new Date(),
    }).where(eq(webhooksTable.id, id));

    res.json({ success: true, payload: testPayload, message: "Test call recorded" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.all("/incoming/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const [webhook] = await db.select().from(webhooksTable).where(eq(webhooksTable.slug, slug));
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });
    if (!webhook.enabled) return res.status(403).json({ error: "Webhook is disabled" });
    if (webhook.method !== "ANY" && req.method !== webhook.method) {
      return res.status(405).json({ error: `Expected ${webhook.method}, got ${req.method}` });
    }

    if (webhook.secret) {
      const providedSecret = req.headers["x-webhook-secret"] as string;
      if (!providedSecret) {
        return res.status(401).json({ error: "Missing x-webhook-secret header" });
      }
      const a = Buffer.from(webhook.secret);
      const b = Buffer.from(providedSecret);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: "Invalid webhook secret" });
      }
    }

    const payload = req.body || {};
    await db.update(webhooksTable).set({
      lastCalledAt: new Date(),
      callCount: (webhook.callCount || 0) + 1,
      lastPayload: payload,
      lastStatus: "success",
      updatedAt: new Date(),
    }).where(eq(webhooksTable.id, webhook.id));

    res.json({ received: true, webhookId: webhook.id, workflowId: webhook.workflowId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
