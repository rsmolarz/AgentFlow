/**
 * AgentFlow Bridge API Routes
 *
 * Manages local Mac bridge machine connections and job dispatch via WebSocket.
 */

import { Router, Request, Response } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createHash, randomBytes } from 'crypto';
import { db } from '@workspace/db';
import { bridgeMachines, bridgeJobs, bridgeJobOutput } from '@workspace/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedMachine {
  ws: WebSocket;
  machineDbId: string;
  machineId: string;
  machineName: string;
  connectedAt: Date;
}

// Map of machineId → WebSocket connection
const connectedMachines = new Map<string, ConnectedMachine>();

// Map of jobId → SSE response streams waiting for output
const jobStreams = new Map<string, Set<Response>>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function generateApiKey(): string {
  return `af_b_${randomBytes(24).toString('hex')}`;
}

function sseWrite(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── REST: Machine Management ─────────────────────────────────────────────────

// GET /api/bridge/machines — list all registered machines
router.get('/machines', async (_req, res) => {
  const machines = await db
    .select({
      id: bridgeMachines.id,
      name: bridgeMachines.name,
      apiKeyPrefix: bridgeMachines.apiKeyPrefix,
      machineId: bridgeMachines.machineId,
      hostname: bridgeMachines.hostname,
      platform: bridgeMachines.platform,
      arch: bridgeMachines.arch,
      status: bridgeMachines.status,
      lastSeenAt: bridgeMachines.lastSeenAt,
      isEnabled: bridgeMachines.isEnabled,
      createdAt: bridgeMachines.createdAt,
    })
    .from(bridgeMachines)
    .orderBy(desc(bridgeMachines.createdAt));

  // Enrich with live connection status
  const enriched = machines.map(m => ({
    ...m,
    isLive: connectedMachines.has(m.machineId),
  }));

  res.json(enriched);
});

// POST /api/bridge/machines — register a new machine + generate API key
router.post('/machines', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);
  const apiKeyPrefix = apiKey.slice(0, 12);

  const [machine] = await db
    .insert(bridgeMachines)
    .values({
      name: parsed.data.name,
      apiKeyHash,
      apiKeyPrefix,
      machineId: `pending-${randomBytes(8).toString('hex')}`, // updated on first connect
    })
    .returning();

  // Return the plaintext key ONCE — it will never be shown again
  res.status(201).json({ ...machine, apiKey });
});

// DELETE /api/bridge/machines/:id — revoke a machine
router.delete('/machines/:id', async (req, res) => {
  const machine = await db.query.bridgeMachines.findFirst({
    where: eq(bridgeMachines.id, req.params.id),
  });
  if (!machine) return res.status(404).json({ error: 'Not found' });

  // Disconnect if live
  const live = connectedMachines.get(machine.machineId);
  if (live) {
    live.ws.close(1000, 'Machine revoked');
    connectedMachines.delete(machine.machineId);
  }

  await db.delete(bridgeMachines).where(eq(bridgeMachines.id, req.params.id));
  res.json({ ok: true });
});

// ─── REST: Job Management ─────────────────────────────────────────────────────

// POST /api/bridge/jobs — queue a job for a machine
router.post('/jobs', async (req, res) => {
  const schema = z.object({
    machineId: z.string(), // DB id of the machine
    command: z.string().min(1),
    cwd: z.string().optional(),
    env: z.record(z.string()).optional(),
    timeoutMs: z.number().int().min(1000).max(3600000).optional(),
    workflowExecutionId: z.string().optional(),
    nodeId: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const machine = await db.query.bridgeMachines.findFirst({
    where: eq(bridgeMachines.id, parsed.data.machineId),
  });
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  if (!machine.isEnabled) return res.status(403).json({ error: 'Machine is disabled' });

  const live = connectedMachines.get(machine.machineId);
  if (!live) {
    return res.status(503).json({ error: 'Machine is not connected', machineStatus: 'offline' });
  }

  const [job] = await db
    .insert(bridgeJobs)
    .values({
      machineId: machine.id,
      command: parsed.data.command,
      cwd: parsed.data.cwd,
      env: parsed.data.env,
      timeoutMs: parsed.data.timeoutMs ?? 300000,
      status: 'queued',
      workflowExecutionId: parsed.data.workflowExecutionId,
      nodeId: parsed.data.nodeId,
    })
    .returning();

  // Dispatch to the connected machine via WebSocket
  live.ws.send(JSON.stringify({
    type: 'execute',
    jobId: job.id,
    command: job.command,
    cwd: job.cwd,
    env: job.env,
    timeout: job.timeoutMs,
  }));

  await db
    .update(bridgeJobs)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(bridgeJobs.id, job.id));

  res.status(201).json(job);
});

// GET /api/bridge/jobs/:id — get job status
router.get('/jobs/:id', async (req, res) => {
  const job = await db.query.bridgeJobs.findFirst({
    where: eq(bridgeJobs.id, req.params.id),
  });
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

// GET /api/bridge/jobs/:id/stream — SSE stream of job output
router.get('/jobs/:id/stream', async (req, res) => {
  const jobId = req.params.id;

  const job = await db.query.bridgeJobs.findFirst({
    where: eq(bridgeJobs.id, jobId),
  });
  if (!job) return res.status(404).json({ error: 'Not found' });

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send existing output first (for reconnects)
  const existingOutput = await db
    .select()
    .from(bridgeJobOutput)
    .where(eq(bridgeJobOutput.jobId, jobId))
    .orderBy(bridgeJobOutput.seq);

  for (const chunk of existingOutput) {
    sseWrite(res, 'output', { stream: chunk.stream, data: chunk.data, seq: chunk.seq });
  }

  // If already complete, send final status and close
  if (['completed', 'failed', 'timeout', 'cancelled'].includes(job.status)) {
    sseWrite(res, 'complete', { status: job.status, exitCode: job.exitCode, durationMs: job.durationMs });
    return res.end();
  }

  // Register this response for live streaming
  if (!jobStreams.has(jobId)) jobStreams.set(jobId, new Set());
  jobStreams.get(jobId)!.add(res);

  req.on('close', () => {
    jobStreams.get(jobId)?.delete(res);
  });
});

// POST /api/bridge/jobs/:id/cancel — cancel a running job
router.post('/jobs/:id/cancel', async (req, res) => {
  const job = await db.query.bridgeJobs.findFirst({
    where: and(
      eq(bridgeJobs.id, req.params.id),
    ),
  });
  if (!job) return res.status(404).json({ error: 'Not found' });

  const machine = await db.query.bridgeMachines.findFirst({
    where: eq(bridgeMachines.id, job.machineId),
  });
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const live = connectedMachines.get(machine.machineId);
  if (live) {
    live.ws.send(JSON.stringify({ type: 'kill', jobId: job.id }));
  }

  await db
    .update(bridgeJobs)
    .set({ status: 'cancelled', completedAt: new Date() })
    .where(eq(bridgeJobs.id, req.params.id));

  res.json({ ok: true });
});

// ─── WebSocket Handler ────────────────────────────────────────────────────────

let wss: WebSocketServer | null = null;

export function initBridgeWebSocket(server: HttpServer): void {
  wss = new WebSocketServer({ server, path: '/api/bridge/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let authenticated = false;
    let machineDbId = '';
    let machineId = '';
    let outputSeqCounters = new Map<string, number>();

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    ws.on('message', async (raw: Buffer) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // ── Registration ──────────────────────────────────────────────────────
      if (msg.type === 'register') {
        const keyHash = hashApiKey(msg.apiKey || '');
        const machine = await db.query.bridgeMachines.findFirst({
          where: eq(bridgeMachines.apiKeyHash, keyHash),
        });

        if (!machine || !machine.isEnabled) {
          ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid or disabled API key' }));
          ws.close(1008, 'Unauthorized');
          return;
        }

        // Update machine record with live info
        await db
          .update(bridgeMachines)
          .set({
            machineId: msg.machineId,
            hostname: msg.machineName,
            platform: msg.platform,
            arch: msg.arch,
            status: 'online',
            lastSeenAt: new Date(),
          })
          .where(eq(bridgeMachines.id, machine.id));

        machineDbId = machine.id;
        machineId = msg.machineId;
        authenticated = true;

        connectedMachines.set(machineId, {
          ws,
          machineDbId,
          machineId,
          machineName: msg.machineName,
          connectedAt: new Date(),
        });

        ws.send(JSON.stringify({ type: 'registered', machineId, ok: true }));
        console.log(`[Bridge] Machine connected: ${msg.machineName} (${machineId})`);
        return;
      }

      if (!authenticated) {
        ws.send(JSON.stringify({ type: 'auth_error', message: 'Not authenticated' }));
        return;
      }

      // ── Output chunk ──────────────────────────────────────────────────────
      if (msg.type === 'output') {
        const seq = (outputSeqCounters.get(msg.jobId) || 0) + 1;
        outputSeqCounters.set(msg.jobId, seq);

        await db.insert(bridgeJobOutput).values({
          jobId: msg.jobId,
          stream: msg.stream,
          data: msg.data,
          seq,
        });

        // Fan out to SSE listeners
        const streams = jobStreams.get(msg.jobId);
        if (streams) {
          for (const res of streams) {
            sseWrite(res, 'output', { stream: msg.stream, data: msg.data, seq });
          }
        }
      }

      // ── Job complete ──────────────────────────────────────────────────────
      if (msg.type === 'complete') {
        // Collect all output for the aggregated columns
        const allOutput = await db
          .select()
          .from(bridgeJobOutput)
          .where(eq(bridgeJobOutput.jobId, msg.jobId))
          .orderBy(bridgeJobOutput.seq);

        const stdout = allOutput.filter(o => o.stream === 'stdout').map(o => o.data).join('');
        const stderr = allOutput.filter(o => o.stream === 'stderr').map(o => o.data).join('');

        await db
          .update(bridgeJobs)
          .set({
            status: msg.exitCode === 0 ? 'completed' : 'failed',
            exitCode: msg.exitCode,
            durationMs: msg.duration,
            stdout,
            stderr,
            completedAt: new Date(),
          })
          .where(eq(bridgeJobs.id, msg.jobId));

        // Notify SSE listeners
        const streams = jobStreams.get(msg.jobId);
        if (streams) {
          for (const res of streams) {
            sseWrite(res, 'complete', {
              status: msg.exitCode === 0 ? 'completed' : 'failed',
              exitCode: msg.exitCode,
              durationMs: msg.duration,
            });
            res.end();
          }
          jobStreams.delete(msg.jobId);
        }
        outputSeqCounters.delete(msg.jobId);
      }

      // ── Job error ─────────────────────────────────────────────────────────
      if (msg.type === 'job_error') {
        await db
          .update(bridgeJobs)
          .set({ status: 'failed', stderr: msg.error, completedAt: new Date() })
          .where(eq(bridgeJobs.id, msg.jobId));

        const streams = jobStreams.get(msg.jobId);
        if (streams) {
          for (const res of streams) {
            sseWrite(res, 'error', { error: msg.error });
            res.end();
          }
          jobStreams.delete(msg.jobId);
        }
      }

      // ── Pong / status ─────────────────────────────────────────────────────
      if (msg.type === 'pong' || msg.type === 'status') {
        await db
          .update(bridgeMachines)
          .set({ lastSeenAt: new Date() })
          .where(eq(bridgeMachines.id, machineDbId));
      }
    });

    ws.on('close', async () => {
      clearInterval(pingInterval);
      if (machineId) {
        connectedMachines.delete(machineId);
        await db
          .update(bridgeMachines)
          .set({ status: 'offline', lastSeenAt: new Date() })
          .where(eq(bridgeMachines.id, machineDbId));
        console.log(`[Bridge] Machine disconnected: ${machineId}`);
      }
    });

    ws.on('error', (err) => {
      console.error('[Bridge] WebSocket error:', err.message);
    });
  });

  console.log('[Bridge] WebSocket server initialized at /api/bridge/ws');
}

export default router;
