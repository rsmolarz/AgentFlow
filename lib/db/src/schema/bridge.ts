import { pgTable, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';

// ─── Bridge Machines ──────────────────────────────────────────────────────────
// Registered Mac machines that can execute local shell commands.

export const bridgeMachines = pgTable('bridge_machines', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),

  // Display name shown in workflow node selectors
  name: text('name').notNull(),

  // SHA-256 hash of the API key (never store plaintext)
  apiKeyHash: text('api_key_hash').notNull().unique(),

  // Prefix shown in UI (first 8 chars of key, e.g. "af_b_1a2b")
  apiKeyPrefix: text('api_key_prefix').notNull(),

  // Machine metadata sent during registration
  machineId: text('machine_id').notNull().unique(),
  hostname: text('hostname'),
  platform: text('platform'),
  arch: text('arch'),

  // Connection state
  status: text('status', { enum: ['online', 'offline'] }).notNull().default('offline'),
  lastSeenAt: timestamp('last_seen_at'),

  // Feature flags
  isEnabled: boolean('is_enabled').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  machineIdIdx: index('bridge_machines_machine_id_idx').on(t.machineId),
  statusIdx: index('bridge_machines_status_idx').on(t.status),
}));

// ─── Bridge Jobs ──────────────────────────────────────────────────────────────
// Individual shell commands dispatched to a bridge machine.

export const bridgeJobs = pgTable('bridge_jobs', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),

  machineId: text('machine_id').notNull()
    .references(() => bridgeMachines.id, { onDelete: 'cascade' }),

  // The command that was dispatched
  command: text('command').notNull(),
  cwd: text('cwd'),
  env: jsonb('env').$type<Record<string, string>>(),
  timeoutMs: integer('timeout_ms').notNull().default(300000),

  // Status lifecycle: queued → running → completed | failed | timeout | cancelled
  status: text('status', {
    enum: ['queued', 'running', 'completed', 'failed', 'timeout', 'cancelled'],
  }).notNull().default('queued'),

  // Aggregated output (set on completion)
  stdout: text('stdout'),
  stderr: text('stderr'),
  exitCode: integer('exit_code'),
  durationMs: integer('duration_ms'),

  // Which workflow execution triggered this job (optional, for traceability)
  workflowExecutionId: text('workflow_execution_id'),
  nodeId: text('node_id'),

  queuedAt: timestamp('queued_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  machineIdIdx: index('bridge_jobs_machine_id_idx').on(t.machineId),
  statusIdx: index('bridge_jobs_status_idx').on(t.status),
  workflowExecIdx: index('bridge_jobs_workflow_exec_idx').on(t.workflowExecutionId),
}));

// ─── Bridge Job Output Chunks ─────────────────────────────────────────────────
// Streaming output lines stored for SSE replay and log viewing.

export const bridgeJobOutput = pgTable('bridge_job_output', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  jobId: text('job_id').notNull()
    .references(() => bridgeJobs.id, { onDelete: 'cascade' }),
  stream: text('stream', { enum: ['stdout', 'stderr'] }).notNull(),
  data: text('data').notNull(),
  seq: integer('seq').notNull(), // for ordering
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  jobIdIdx: index('bridge_job_output_job_id_idx').on(t.jobId),
  jobSeqIdx: index('bridge_job_output_job_seq_idx').on(t.jobId, t.seq),
}));

export type BridgeMachine = typeof bridgeMachines.$inferSelect;
export type NewBridgeMachine = typeof bridgeMachines.$inferInsert;
export type BridgeJob = typeof bridgeJobs.$inferSelect;
export type NewBridgeJob = typeof bridgeJobs.$inferInsert;
export type BridgeJobOutput = typeof bridgeJobOutput.$inferSelect;
