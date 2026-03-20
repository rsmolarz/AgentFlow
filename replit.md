# Workspace

## Overview

AgentFlow - AI Agent Management Platform. A comprehensive platform for managing AI agents, building visual workflows, monitoring executions, managing knowledge bases (RAG), and using pre-built templates.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui
- **Workflow Canvas**: @xyflow/react (React Flow)
- **Charts**: recharts
- **Routing**: wouter
- **Animations**: framer-motion

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── agentflow/          # React + Vite frontend (mounted at /)
│   └── api-server/         # Express API server (mounted at /api)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Frontend Pages

- **Dashboard** (`/`) - Analytics overview with onboarding checklist (3 steps, localStorage persistence), stat cards with tooltips, execution trends chart, recent executions, quick action cards with descriptions, cost breakdown by provider (OpenAI/Anthropic/Google) with progress bars, expanded platform status panel (8 services: API, PostgreSQL, OpenAI, Anthropic, Google AI, Vector Store, Queue, MCP)
- **Agents** (`/agents`) - Grid of AI agent cards with create/delete, search, provider badges (GPT/CLA/GEM), info banner explaining agents, enhanced create form with model options per provider, temperature/memory explanations, help text on every field. Advanced Configuration section: CrewAI-style role assignment (worker/researcher/writer/reviewer/coordinator/analyst), memory modules (conversation/summary/semantic/persistent with cross-thread and semantic search options), tool selection (8 tools: web search, code exec, file search, API requests, SQL query, calculator, knowledge base, image gen), guardrails (input validation, output moderation, PII detection, token limit), and agent handoffs toggle
- **AI Builder** (`/ai-builder`) - Natural language workflow builder: describe automations in plain English, system generates workflow structure (nodes + edges) with animated reasoning steps. 6 example prompts, pattern-based generation engine (trigger type detection, agent/condition/loop/delay/error handling), "Create & Open in Builder" saves via API and redirects to editor. Highlighted in sidebar with "New" badge.
- **Workflows** (`/workflows`) - List of workflows with node counts, run stats, create/delete
- **Workflow Editor** (`/workflows/:id/edit`) - Full-screen React Flow canvas with:
  - Drag-and-drop node palette with 12 node types: trigger, agent, condition, output, code, llm_call, transform, error_handler, delay, loop, human_review, merge
  - Each node type has description, icon, and color coding
  - **Slide-out NodeConfigPanel**: Click any node to open type-specific config (trigger type/schedule/webhook, agent selection, condition rules, code editor, LLM prompt template, transform mappings, error handler actions, delay duration, loop config, human review settings, merge strategy)
  - Every config field has help text/tooltips and inline instructions
  - Getting Started guide (? icon in palette)
  - Empty canvas onboarding prompt
  - Condition nodes show Pass/Fail labels on output handles
  - Node delete and duplicate from config panel
  - Workflow name shown in top bar
- **Executions** (`/executions`) - Table with search/filter, info banner explaining executions, click-to-open detail slide-over showing step-by-step execution logs with input/output/error per step, actionable error suggestions, token usage per step
- **Knowledge Bases** (`/knowledge-bases`) - Cards with document/chunk counts, info banner explaining RAG, click-to-open detail panel with drag-and-drop document upload UI, document list with status, configuration view (chunk size, overlap, embedding model)
- **Templates** (`/templates`) - Gallery split by agent/workflow categories, info banner explaining templates, category badges, tag display
- **Integrations** (`/integrations`) - Marketplace with 82+ integrations across 12 categories (LLM Providers, Communication, Databases, Productivity, Developer Tools, CRM & Sales, Cloud Storage, Analytics, Payments, Vector Stores, Media). Search/filter by category, connect/disconnect toggle with state tracking, connected count, node counts, popular badges, custom integration section (HTTP Request + Code nodes)
- **Evaluations** (`/evaluations`) - LangSmith-style evaluation monitoring: quality score summary (accuracy, relevance, coherence, safety) with animated SVG ring charts, stat cards (avg quality, total tests, pass rate, eval cost), expandable evaluation run list with per-run metrics and metric bars, filter by status, "Run Evaluation" button
- **Settings** (`/settings`) - 7-tab settings page: General (platform name, default provider/model, cost controls, token budget, streaming), LLM Providers (10+ providers with connected status, model lists, API key fields), MCP Server (enable/disable, URL, auth, tools, version), Security & SSO (SAML/OIDC, identity providers, rate limiting, IP whitelist, audit logging), API Keys (generate/revoke, scoped permissions), Notifications (email/Slack/webhook alerts), Advanced (parallel execution, time travel debugging, code runtime, guardrails config)

## API Routes

All routes mounted under `/api`:
- `GET /api/health` - Health check
- `GET/POST /api/agents` - List/create agents
- `GET/PATCH/DELETE /api/agents/:id` - Agent CRUD
- `GET/POST /api/workflows` - List/create workflows
- `GET/PATCH/DELETE /api/workflows/:id` - Workflow CRUD
- `POST /api/workflows/:id/run` - Run workflow (creates execution with simulation)
- `GET /api/executions` - List executions with pagination
- `GET /api/executions/:id` - Get execution details with step logs
- `GET/POST /api/knowledge-bases` - List/create knowledge bases
- `DELETE /api/knowledge-bases/:id` - Delete knowledge base
- `GET /api/templates` - List templates (inline data)
- `POST /api/templates/:id/apply` - Apply template (creates agent/workflow)
- `GET /api/analytics/overview` - Dashboard analytics
- `GET /api/analytics/execution-trends` - Execution trends (last 7 days)

## Database Schema

Tables in `lib/db/src/schema/`:
- `agents` - AI agents with provider, model, tools, temperature, memory settings
- `workflows` - Workflow definitions with JSON node/edge graph
- `executions` - Execution records with status, duration, tokens, step logs
- `knowledgeBases` - Knowledge base metadata with document/chunk counts
- `documents` - Documents belonging to knowledge bases

Seed script: `pnpm --filter @workspace/scripts run seed`

## Important Notes

- **Tailwind CSS v4**: Does NOT support `@apply customUtility` inside another `@layer utilities` class. Custom utilities like `glass-card` must be used as className directly.
- **Zod date handling**: Generated schemas use `zod.coerce.date()` for date-time fields to handle JSON string dates.
- **API codegen**: Run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- **DB push**: Run `pnpm --filter @workspace/db run push` after schema changes

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/agentflow` (`@workspace/agentflow`)

React + Vite frontend application. Dark mode professional UI with glass-card design.

- Pages in `src/pages/`
- Layout component with sidebar in `src/components/layout.tsx`
- Uses `@workspace/api-client-react` for API calls
- shadcn/ui components in `src/components/ui/`

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
