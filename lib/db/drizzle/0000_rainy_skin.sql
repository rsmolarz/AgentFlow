CREATE TABLE IF NOT EXISTS "agents" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text DEFAULT '',
        "role" text NOT NULL,
        "goal" text DEFAULT '',
        "backstory" text DEFAULT '',
        "model" text DEFAULT 'gpt-4o' NOT NULL,
        "provider" text DEFAULT 'openai' NOT NULL,
        "temperature" real DEFAULT 0.7,
        "max_tokens" integer DEFAULT 4096,
        "tools" jsonb DEFAULT '[]'::jsonb,
        "memory_enabled" boolean DEFAULT true,
        "status" text DEFAULT 'active' NOT NULL,
        "system_prompt" text DEFAULT '',
        "icon" text DEFAULT 'bot',
        "color" text DEFAULT '#3b82f6',
        "execution_count" integer DEFAULT 0,
        "avg_response_time" real DEFAULT 0,
        "success_rate" real DEFAULT 100,
        "last_ping_at" timestamp,
        "health_status" text DEFAULT 'unknown',
        "health_message" text DEFAULT '',
        "health_latency" real,
        "tags" jsonb DEFAULT '[]'::jsonb,
        "safety_filter" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflows" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text DEFAULT '',
        "status" text DEFAULT 'draft' NOT NULL,
        "tags" jsonb DEFAULT '[]'::jsonb,
        "definition" jsonb DEFAULT '{"nodes":[],"edges":[]}'::jsonb NOT NULL,
        "execution_count" integer DEFAULT 0,
        "last_run_at" timestamp,
        "avg_duration" real DEFAULT 0,
        "success_rate" real DEFAULT 100,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "execution_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "execution_id" integer NOT NULL,
        "node_id" text NOT NULL,
        "node_name" text DEFAULT '',
        "node_type" text DEFAULT '',
        "status" text DEFAULT 'pending' NOT NULL,
        "input" jsonb,
        "output" jsonb,
        "error" text,
        "started_at" timestamp,
        "completed_at" timestamp,
        "duration" real,
        "tokens_used" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "executions" (
        "id" serial PRIMARY KEY NOT NULL,
        "workflow_id" integer NOT NULL,
        "workflow_name" text DEFAULT '',
        "status" text DEFAULT 'pending' NOT NULL,
        "input_data" jsonb DEFAULT '{}'::jsonb,
        "output_data" jsonb,
        "error" text,
        "started_at" timestamp,
        "completed_at" timestamp,
        "duration" real,
        "tokens_used" integer DEFAULT 0,
        "cost" real DEFAULT 0,
        "current_step" text,
        "total_steps" integer DEFAULT 0,
        "completed_steps" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
        "id" serial PRIMARY KEY NOT NULL,
        "knowledge_base_id" integer NOT NULL,
        "title" text NOT NULL,
        "content" text DEFAULT '',
        "source_type" text DEFAULT 'text',
        "source_url" text,
        "chunk_count" integer DEFAULT 0,
        "status" text DEFAULT 'processing' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_bases" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text DEFAULT '',
        "document_count" integer DEFAULT 0,
        "total_chunks" integer DEFAULT 0,
        "embedding_model" text DEFAULT 'text-embedding-3-small',
        "status" text DEFAULT 'ready' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text DEFAULT '',
        "category" text DEFAULT 'general' NOT NULL,
        "priority" text DEFAULT 'medium' NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "votes" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eval_runs" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "agent_id" integer,
        "agent_name" text DEFAULT '' NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "score" real DEFAULT 0,
        "total_tests" integer DEFAULT 0,
        "passed_tests" integer DEFAULT 0,
        "failed_tests" integer DEFAULT 0,
        "avg_latency" real DEFAULT 0,
        "token_usage" integer DEFAULT 0,
        "cost" real DEFAULT 0,
        "metrics" jsonb DEFAULT '{"accuracy":0,"relevance":0,"coherence":0,"safety":0}'::jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integrations" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "description" text DEFAULT '',
        "icon" text DEFAULT '',
        "connected" boolean DEFAULT false,
        "api_key" text,
        "popular" boolean DEFAULT false,
        "nodes" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "integrations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "key" text NOT NULL,
        "value" jsonb DEFAULT '{}'::jsonb,
        "category" text DEFAULT 'general' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ab_test_results" (
        "id" serial PRIMARY KEY NOT NULL,
        "test_id" integer NOT NULL,
        "prompt" text NOT NULL,
        "agent_a_response" text DEFAULT '',
        "agent_b_response" text DEFAULT '',
        "agent_a_tokens" integer DEFAULT 0,
        "agent_b_tokens" integer DEFAULT 0,
        "agent_a_duration" real DEFAULT 0,
        "agent_b_duration" real DEFAULT 0,
        "agent_a_cost" real DEFAULT 0,
        "agent_b_cost" real DEFAULT 0,
        "winner" text DEFAULT '',
        "scores" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ab_tests" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text DEFAULT '',
        "status" text DEFAULT 'draft' NOT NULL,
        "agent_a_id" integer NOT NULL,
        "agent_b_id" integer NOT NULL,
        "test_prompts" jsonb DEFAULT '[]'::jsonb,
        "total_runs" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_versions" (
        "id" serial PRIMARY KEY NOT NULL,
        "workflow_id" integer NOT NULL,
        "version" integer DEFAULT 1 NOT NULL,
        "label" text DEFAULT '',
        "definition" jsonb DEFAULT '{"nodes":[],"edges":[]}'::jsonb NOT NULL,
        "node_count" integer DEFAULT 0,
        "edge_count" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bulk_executions" (
        "id" serial PRIMARY KEY NOT NULL,
        "workflow_id" integer NOT NULL,
        "workflow_name" text DEFAULT '',
        "status" text DEFAULT 'pending' NOT NULL,
        "total_rows" integer DEFAULT 0,
        "completed_rows" integer DEFAULT 0,
        "failed_rows" integer DEFAULT 0,
        "headers" jsonb DEFAULT '[]'::jsonb,
        "results" jsonb DEFAULT '[]'::jsonb,
        "started_at" timestamp,
        "completed_at" timestamp,
        "duration" real,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflow_schedules" (
        "id" serial PRIMARY KEY NOT NULL,
        "workflow_id" integer NOT NULL,
        "cron_expression" text NOT NULL,
        "timezone" text DEFAULT 'UTC' NOT NULL,
        "enabled" boolean DEFAULT true NOT NULL,
        "label" text DEFAULT '',
        "last_run_at" timestamp,
        "next_run_at" timestamp,
        "run_count" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "workflow_id" integer,
        "method" text DEFAULT 'POST' NOT NULL,
        "enabled" boolean DEFAULT true NOT NULL,
        "secret" text,
        "description" text DEFAULT '',
        "last_called_at" timestamp,
        "call_count" integer DEFAULT 0 NOT NULL,
        "last_payload" jsonb,
        "last_status" text DEFAULT 'never',
        "headers" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "webhooks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cost_alerts" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "budget_amount" numeric(12, 2) NOT NULL,
        "current_spend" numeric(12, 2) DEFAULT '0' NOT NULL,
        "alert_threshold" integer DEFAULT 80 NOT NULL,
        "enabled" boolean DEFAULT true NOT NULL,
        "alert_type" text DEFAULT 'monthly' NOT NULL,
        "notify_email" boolean DEFAULT true NOT NULL,
        "notify_in_app" boolean DEFAULT true NOT NULL,
        "triggered" boolean DEFAULT false NOT NULL,
        "triggered_at" timestamp,
        "reset_day" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prompts" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "content" text NOT NULL,
        "category" varchar(100) DEFAULT 'general',
        "tags" jsonb DEFAULT '[]'::jsonb,
        "description" varchar(500),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "action" text NOT NULL,
        "entity_type" text NOT NULL,
        "entity_id" text,
        "user_id" text DEFAULT 'system',
        "user_name" text DEFAULT 'System',
        "details" jsonb DEFAULT '{}'::jsonb,
        "ip_address" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "type" text NOT NULL,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "read" boolean DEFAULT false,
        "data" jsonb DEFAULT '{}'::jsonb,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_presets" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "role" text NOT NULL,
        "description" text NOT NULL,
        "icon" text DEFAULT '🤖',
        "category" text DEFAULT 'general',
        "system_prompt" text,
        "model" text DEFAULT 'gpt-4o',
        "tools" jsonb DEFAULT '[]'::jsonb,
        "config" jsonb DEFAULT '{}'::jsonb,
        "builtin" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "executions" ADD CONSTRAINT "executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "documents" ADD CONSTRAINT "documents_knowledge_base_id_knowledge_bases_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_test_id_ab_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."ab_tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_agent_a_id_agents_id_fk" FOREIGN KEY ("agent_a_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_agent_b_id_agents_id_fk" FOREIGN KEY ("agent_b_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "bulk_executions" ADD CONSTRAINT "bulk_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "workflow_schedules" ADD CONSTRAINT "workflow_schedules_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;