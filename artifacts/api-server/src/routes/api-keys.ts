import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { apiKeysTable, webauthnCredentialsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function generateApiKey(): string {
  const prefix = "af_sk_";
  const randomPart = crypto.randomBytes(24).toString("base64url");
  return prefix + randomPart;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

router.get("/api-keys", async (req, res) => {
  try {
    const keys = await db
      .select({
        id: apiKeysTable.id,
        name: apiKeysTable.name,
        keyPrefix: apiKeysTable.keyPrefix,
        scopes: apiKeysTable.scopes,
        lastUsedAt: apiKeysTable.lastUsedAt,
        revoked: apiKeysTable.revoked,
        createdAt: apiKeysTable.createdAt,
      })
      .from(apiKeysTable)
      .orderBy(desc(apiKeysTable.createdAt));
    res.json(keys);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api-keys", async (req, res) => {
  try {
    const { name, scopes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);

    const [created] = await db.insert(apiKeysTable).values({
      name: name.trim(),
      keyPrefix,
      keyHash,
      scopes: scopes || ["read"],
    }).returning();

    res.status(201).json({
      id: created.id,
      name: created.name,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      createdAt: created.createdAt,
      rawKey,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/api-keys/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "API key not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api-keys/:id/revoke", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db.update(apiKeysTable)
      .set({ revoked: true, updatedAt: new Date() })
      .where(eq(apiKeysTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "API key not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const challenges = new Map<string, { challenge: string; expires: number }>();

router.post("/webauthn/register-options", async (_req, res) => {
  try {
    const challenge = crypto.randomBytes(32).toString("base64url");
    const sessionId = crypto.randomBytes(16).toString("hex");
    challenges.set(sessionId, { challenge, expires: Date.now() + 300000 });

    res.json({
      sessionId,
      publicKey: {
        challenge,
        rp: { name: "AgentFlow", id: new URL(process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost").hostname },
        user: {
          id: crypto.randomBytes(16).toString("base64url"),
          name: "admin@agentflow.io",
          displayName: "AgentFlow Admin",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform",
          userVerification: "preferred",
          requireResidentKey: false,
        },
        timeout: 120000,
        attestation: "none",
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/webauthn/register", async (req, res) => {
  try {
    const { sessionId, credential } = req.body;
    const session = challenges.get(sessionId);
    if (!session || session.expires < Date.now()) {
      return res.status(400).json({ error: "Challenge expired" });
    }
    challenges.delete(sessionId);

    const [saved] = await db.insert(webauthnCredentialsTable).values({
      credentialId: credential.id,
      publicKey: credential.publicKey || credential.id,
      counter: "0",
      deviceName: credential.deviceName || "YubiKey",
    }).returning();

    res.json({ success: true, credential: saved });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/webauthn/auth-options", async (_req, res) => {
  try {
    const creds = await db.select().from(webauthnCredentialsTable);
    if (creds.length === 0) {
      return res.status(400).json({ error: "No YubiKey registered. Register one first." });
    }

    const challenge = crypto.randomBytes(32).toString("base64url");
    const sessionId = crypto.randomBytes(16).toString("hex");
    challenges.set(sessionId, { challenge, expires: Date.now() + 300000 });

    res.json({
      sessionId,
      publicKey: {
        challenge,
        rpId: new URL(process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost").hostname,
        allowCredentials: creds.map(c => ({
          type: "public-key",
          id: c.credentialId,
        })),
        timeout: 120000,
        userVerification: "preferred",
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/webauthn/authenticate", async (req, res) => {
  try {
    const { sessionId, credential, apiKeyId } = req.body;
    const session = challenges.get(sessionId);
    if (!session || session.expires < Date.now()) {
      return res.status(400).json({ error: "Challenge expired" });
    }
    challenges.delete(sessionId);

    const [cred] = await db.select().from(webauthnCredentialsTable)
      .where(eq(webauthnCredentialsTable.credentialId, credential.id));
    if (!cred) {
      return res.status(400).json({ error: "Unknown credential" });
    }

    if (apiKeyId) {
      const [key] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.id, Number(apiKeyId)));
      if (!key) return res.status(404).json({ error: "API key not found" });

      res.json({
        success: true,
        verified: true,
        apiKey: {
          id: key.id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          keyHash: key.keyHash,
        },
      });
    } else {
      res.json({ success: true, verified: true });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/webauthn/credentials", async (_req, res) => {
  try {
    const creds = await db.select({
      id: webauthnCredentialsTable.id,
      credentialId: webauthnCredentialsTable.credentialId,
      deviceName: webauthnCredentialsTable.deviceName,
      createdAt: webauthnCredentialsTable.createdAt,
    }).from(webauthnCredentialsTable)
      .orderBy(desc(webauthnCredentialsTable.createdAt));
    res.json(creds);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/webauthn/credentials/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [deleted] = await db.delete(webauthnCredentialsTable).where(eq(webauthnCredentialsTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Credential not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
