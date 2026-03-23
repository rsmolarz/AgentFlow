# Overview

AgentFlow is an AI Agent Management Platform enabling users to build, manage, and monitor AI agents and their workflows. It features visual workflow creation, natural language workflow generation, robust execution monitoring, knowledge base management (RAG), and extensive integrations. The platform aims to simplify AI-powered automation development, offering a seamless experience for defining agent behaviors and ensuring reliable execution.

**Business Vision**: To be the leading platform for operationalizing AI, empowering businesses and individuals to integrate sophisticated AI capabilities without extensive coding knowledge.
**Market Potential**: Capture significant market share in the rapidly expanding AI agent platform market by focusing on ease of use, comprehensive features, and extensibility.
**Project Ambitions**: Establish AgentFlow as the go-to solution for AI orchestration, continuously expanding its integration ecosystem, enhancing AI-driven building capabilities, and refining monitoring and evaluation tools.

# User Preferences

I prefer clear and direct communication. When proposing changes, please outline the high-level approach first and ask for confirmation before diving into implementation details. For code, I appreciate well-structured, readable TypeScript with a preference for functional patterns where they enhance clarity and maintainability. I value iterative development and expect regular updates on progress and any blockers encountered. Do not make changes to the `artifacts` folder without explicit instruction, and always ensure `lib/db/src/schema/` is updated and reviewed for any database-related tasks. I want explanations to be comprehensive but concise, focusing on "why" as much as "what".

# System Architecture

AgentFlow is a pnpm monorepo built with TypeScript, ensuring a clear separation of concerns between frontend and backend services.

## UI/UX Decisions
The frontend uses React, Vite, Tailwind CSS v4, and `shadcn/ui` to provide a modern, professional dark mode UI with a "glass-card" aesthetic. Key UI components are consistently applied across pages, including the dashboard, agent management, workflow editor, knowledge bases, integrations, and evaluation interfaces.

## Technical Implementations

### Frontend (`artifacts/agentflow`)
-   **Technology Stack**: React, Vite, Tailwind CSS v4, shadcn/ui, @xyflow/react (React Flow), recharts, wouter, framer-motion.
-   **Key Features**:
    -   **Agents**: Configuration, chat playground, and AI-powered prompt optimization.
    -   **Workflows**: Visual editor with drag-and-drop nodes, AI Builder for natural language workflow creation, version history, and smart workflow suggestions.
    -   **Monitoring**: Detailed execution logs, LangSmith-style evaluations, and an Agent Health Monitor.
    -   **Data Management**: Knowledge Base creation/management and bulk execution processing for workflows.
    -   **Community**: Templates, feature requests, and an agent leaderboard.

### Backend (`artifacts/api-server`)
-   **Technology Stack**: Node.js 24, Express 5.
-   **API Design**: RESTful API under `/api` for CRUD operations and specific actions.
-   **AI Integration**: Utilizes OpenAI via a proxy for features like prompt optimization and AI judgment in A/B testing.
-   **Validation**: Zod schemas, generated from the OpenAPI spec, ensure robust request and response validation.

### Data Layer (`lib/db`)
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Schema**: Defined in `lib/db/src/schema/` covering all platform entities (agents, workflows, executions, knowledge bases, etc.).
-   **Migrations**: `drizzle-kit push` for schema synchronization during development.

### Monorepo Structure & Build System
-   **Monorepo Tool**: pnpm workspaces for modularity.
-   **TypeScript**: Version 5.9, using composite projects for efficient type-checking.
-   **Build Tool**: esbuild for API server bundling.
-   **API Codegen**: Orval generates API client hooks and Zod schemas from `lib/api-spec/openapi.yaml`.

## Feature Specifications

-   **Agent Configuration**: Supports CrewAI-style roles, various memory modules (conversational, semantic), diverse tools (web search, API, knowledge base), and guardrails.
-   **Workflow Editor**: Features 16 distinct node types with type-specific configurations and contextual help. Includes auto-retry configuration for nodes.
-   **AI Builder**: Generates workflows from natural language descriptions by identifying triggers, agents, conditions, and error handling.
-   **A/B Testing**: Compares agent configurations using GPT-4o as a judge.
-   **Output Formatter**: A workflow node for post-processing agent output into JSON, CSV, or Markdown.
-   **Scheduled Triggers**: Enhanced trigger node in workflow builder with 9 cron presets (5m/15m/1h/6h/9am/12am/M-F/Mon/1st), timezone selector, persistent schedule storage via `workflow_schedules` DB table, active schedule management with enable/disable toggles.
-   **Agent Tags**: Add tags to agents via inline editor on agent cards. Tags stored as jsonb array in agents table. Tag filter bar appears at top of agents page with clickable tag pills. PUT `/api/agents/:id/tags` endpoint. Tags auto-lowercase and deduplicate.
-   **Dark/Light Mode Toggle**: Sun/Moon icon button in the top header nav. ThemeProvider context with localStorage persistence (key: `agentflow-theme`). CSS variables for both themes defined in `index.css` (`:root/.dark` for dark, `.light` for light). Glass utilities, gradients, and scrollbar styles adapt per theme. Default: dark.
-   **Keyboard Shortcuts / Command Palette**: Enhanced `⌘K` search bar doubles as a command palette. When empty, shows all navigation commands (Go to Dashboard, Agents, Workflows, etc.) and actions (toggle theme). Commands grouped by category (Navigation, Actions). Typing filters both commands and search results. Arrow keys navigate, Enter executes, Escape closes.
-   **AI Agent Name Suggester**: "Suggest" button (Sparkles icon) next to Agent Name field in Create Agent form. Calls `POST /api/agents/suggest-names` using GPT-4o-mini to generate 5 creative name ideas based on role, goal, provider, and tools. Names appear as clickable pill chips; clicking one fills the name field.
-   **Token Usage Heatmap**: GitHub-style heatmap on Dashboard showing token consumption by day-of-week and hour-of-day over the last 30 days. `GET /api/analytics/token-heatmap` aggregates from executions table. 7x24 grid with color scale (emerald→amber→red), day/hour labels, hover tooltips, and Less/More legend.
-   **Workflow JSON Import/Export**: Export button (Download icon) on each workflow card downloads a JSON file with name, description, definition, timestamp, and version. Import button (Upload icon) at the top of Workflows page accepts `.json` files and creates a new workflow with "(imported)" suffix. Client-side file handling, no new API endpoints needed.
-   **Agent Dependency Graph**: Collapsible section at bottom of Agents page showing a visual SVG graph of which workflows use which agents. `GET /api/analytics/agent-dependency-graph` scans workflow definitions for `agentId` references. Two-tier layout: agents (green circles with 🤖) on top, workflows (indigo circles with ⚡) on bottom, dashed lines for connections. Legend with counts, inline SVG styles.
-   **Live Execution Log Streaming**: "Live" tab in execution detail panel uses SSE (`GET /api/executions/:id/logs/stream`) for real-time log tailing. Terminal-style dark container with line numbers, timestamps, status codes, node names, and output previews. Connection status indicator (green pulse when streaming, "Complete" badge when done). Auto-scroll toggle. Status bar shows execution progress (completed/total steps, current step). SSE polls DB every second, sends only on changes, auto-closes when execution completes.
-   **Agent Marketplace Tab**: "Marketplace" tab on Templates page showing 9 curated community-shared agents for read-only browsing. Cards display agent name, author, description, downloads, rating, reviews, model, tags, and verified badge. "Preview" button expands card with detailed info. Search, category filter (content/engineering/support/legal/sales/finance/productivity), and sort (downloads/rating). Static dataset, no API needed.
-   **Prompt Library**: Dedicated `/prompts` page for saving, organizing, and reusing system prompts. Full CRUD via `prompts` DB table and `/api/prompts` endpoints. Cards show category badge, name, description, content preview (expandable), tags, and date. Create/edit dialog with name, description, category select, textarea for content, tag input. Category filter buttons (general/assistant/coding/writing/analysis/support/sales/custom), search bar, hover copy/edit/delete actions. Nav item with BookOpen icon.
-   **AI Safety Filter**: Toggle switch on each agent card to enable/disable content moderation. `safety_filter` boolean column in agents table. `PUT /api/agents/:id/safety-filter` endpoint with `{ enabled: boolean }`. Toggle shows Shield icon with "AI Safety Filter" label. Green (emerald) when ON, grey when OFF. Toast notifications on state change.
-   **Execution Replay**: "Re-run" button on each execution row in `/executions` page. Replays the original workflow with the same input data via `POST /api/executions/:id/replay`. Disabled for currently running executions. New execution appears at top of the list after replay.
-   **Cost Alerts**: Budget monitoring in Settings > Notifications. Create alerts with name, budget amount ($), threshold slider (10-100%), and notification preferences (in-app + email). Cards show progress bars (green/amber/red), spend tracking, triggered alerts. Persistent via `cost_alerts` DB table with enable/disable, reset, and delete operations.
-   **Webhook Manager**: Dedicated `/webhooks` page for creating/managing incoming webhook URLs. Features: CRUD operations, unique slug-based URLs, signing secrets with `whsec_` prefix, secret regeneration, test calls, enable/disable toggles, expandable cards with stats/payload viewer, workflow association, secret authentication via `x-webhook-secret` header.
-   **Semantic Search**: AI-powered search bar using OpenAI embeddings (`text-embedding-3-small`) with cosine similarity scoring, fuzzy fallback, ⌘K shortcut, keyboard navigation, dropdown results with match scores.
-   **Audit Log**: Track all platform changes, access events, and system activity. Filterable by entity type (Agent, Workflow, Integration, Settings). Stored in `audit_logs` DB table.
-   **Notification Center**: Bell icon dropdown in header shows recent notifications with unread count badge. Full `/notifications` page with mark-read/delete. `notifications` DB table with type-based icons (success/error/warning/info).
-   **Agent Role Presets**: 10 built-in pre-configured agent templates (API Integrator, Meeting Summarizer, Legal Reviewer, SQL Expert, Email Drafter, Research Assistant, Data Analyst, Content Writer, Code Reviewer, Customer Support). Category filters, search, one-click deploy. `agent_presets` DB table seeded on startup.
-   **Memory Viewer**: Inspect agent memory stores (conversation history, semantic memory, entity memory) with search and clear capabilities. Displays memory entries with timestamps and metadata.
-   **API Rate Limits**: Real-time monitoring of API provider rate limits (OpenAI, Anthropic, Google, Cohere) across multiple models. Progress bars for requests/min and tokens/min usage. Health status indicators.
-   **Debug Trace**: Step-by-step execution trace viewer for debugging agent runs. Shows input/output/duration per step with expandable details, timing breakdown, and status indicators.
-   **Output Validation**: Define and run validation rules (JSON schema, regex, length, keyword checks) against agent outputs. Rule management with enable/disable toggles.
-   **Workflow Refiner**: AI-powered workflow optimization suggestions. Analyzes workflows for performance improvements, error handling, and best practices.
-   **Cost Optimizer AI**: AI analysis of token usage patterns with actionable cost-saving recommendations. Shows monthly cost, tokens used, potential savings, and optimization score.
-   **Team Workspaces**: Multi-team workspace management with member roles (owner/admin/member/viewer), invite system, and per-workspace agent/workflow counts.
-   **Slack Notifications**: Configure Slack webhook integration for real-time alerts. Channel-based event routing (agent-alerts, workflow-updates, general) with per-channel event type selection.
-   **API Keys Management**: Full CRUD for API keys stored in `api_keys` DB table. Keys shown once on creation, subsequent access to the SHA-256 hash requires YubiKey (WebAuthn) authentication. Features: key creation with name/scopes, revocation, deletion, prefix-only display. YubiKey registration/management via `webauthn_credentials` DB table with WebAuthn challenge/response flow.

## System Design Choices

-   **Modularity**: Enforced by the monorepo structure with shared `lib/` packages.
-   **API-First**: Driven by a central OpenAPI specification for consistency and type safety.
-   **Scalability & Extensibility**: Designed for horizontal scaling and easy integration of new services and templates.

# External Dependencies

-   **Database**: PostgreSQL
-   **LLM Providers**: OpenAI, Anthropic, Google AI
-   **Vector Store**: For knowledge base RAG functionality.
-   **Queue**: For asynchronous task processing.
-   **Messaging/Communication**: Slack (for notifications).
-   **Identity Providers**: SAML/OIDC (for Security & SSO).
-   **Third-Party Integrations**: A marketplace of over 82 integrations across 12 categories (communication, databases, productivity, etc.).
-   **Core Libraries**: @xyflow/react, recharts, framer-motion, pnpm, TypeScript, Express, Drizzle ORM, Zod, Orval, esbuild, Vite, Tailwind CSS v4, wouter.