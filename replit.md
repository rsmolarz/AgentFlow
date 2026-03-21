# Overview

AgentFlow is a comprehensive AI Agent Management Platform designed to enable users to build, manage, and monitor AI agents and their workflows. The platform focuses on visual workflow creation, robust execution monitoring, knowledge base management (RAG), and leveraging pre-built templates.

The project aims to simplify the development and deployment of AI-powered automations, offering a seamless experience for defining agent behaviors, integrating various tools, and ensuring reliable execution. Its core capabilities include:

- **AI Agent Management**: Define, configure, and manage diverse AI agents with custom roles, memory modules, and tool integrations.
- **Visual Workflow Builder**: Design complex AI workflows using a drag-and-drop canvas, connecting various node types for triggers, agents, conditions, and external integrations.
- **Natural Language AI Builder**: Generate workflow structures from plain English descriptions, accelerating the automation creation process.
- **Execution Monitoring & Evaluation**: Track workflow executions step-by-step, analyze performance metrics, and evaluate agent quality using LangSmith-style assessments.
- **Knowledge Base Integration**: Create and manage RAG-enabled knowledge bases, allowing agents to access and utilize external information.
- **Extensive Integrations**: Connect with a wide array of LLM providers, communication platforms, databases, and other third-party services.
- **Templates & Community Features**: Utilize pre-built templates for agents and workflows, and contribute/vote on feature requests to guide platform development.

## Business Vision
AgentFlow seeks to be the leading platform for operationalizing AI, empowering businesses and individuals to integrate sophisticated AI capabilities into their daily operations without extensive coding knowledge. By providing an intuitive interface and powerful backend, it aims to unlock new levels of automation and intelligence across various industries.

## Market Potential
The market for AI agent platforms is rapidly expanding as organizations look to scale their AI initiatives. AgentFlow's focus on ease of use, comprehensive features, and extensibility positions it to capture significant market share among developers, data scientists, and business users alike.

## Project Ambitions
Our ambition is to establish AgentFlow as the go-to solution for AI orchestration, continuously expanding its integration ecosystem, enhancing its AI-driven building capabilities, and refining its monitoring and evaluation tools to deliver unparalleled reliability and performance.

# User Preferences

I prefer clear and direct communication. When proposing changes, please outline the high-level approach first and ask for confirmation before diving into implementation details. For code, I appreciate well-structured, readable TypeScript with a preference for functional patterns where they enhance clarity and maintainability. I value iterative development and expect regular updates on progress and any blockers encountered. Do not make changes to the `artifacts` folder without explicit instruction, and always ensure `lib/db/src/schema/` is updated and reviewed for any database-related tasks. I want explanations to be comprehensive but concise, focusing on "why" as much as "what".

# System Architecture

The AgentFlow platform is built as a pnpm monorepo using TypeScript, adhering to a clear separation of concerns between frontend and backend services.

## UI/UX Decisions
The frontend, `artifacts/agentflow`, uses React, Vite, Tailwind CSS v4, and `shadcn/ui` to deliver a modern, professional user interface. It features a dark mode with a distinctive "glass-card" design aesthetic. Key UI components like the layout, navigation, and common elements are consistently applied across pages.

## Technical Implementations

### Frontend (`artifacts/agentflow`)
- **Technology Stack**: React, Vite, Tailwind CSS v4, shadcn/ui, @xyflow/react (React Flow for canvas), recharts, wouter, framer-motion.
- **Pages**:
    - **Dashboard**: Analytics overview, onboarding, stat cards, execution trends, cost breakdown.
    - **Agents**: Grid view, creation form with advanced config (roles, memory, tools, guardrails, handoffs), chat playground (`/agents/:id/chat`), **Prompt Optimizer** (AI-powered system prompt improvement via "Optimize with AI" button in create form).
    - **AI Builder**: Natural language workflow creation, generates workflows from text descriptions.
    - **Workflows**: List view, comprehensive Workflow Editor (`/workflows/:id/edit`) with drag-and-drop nodes, slide-out `NodeConfigPanel` for type-specific settings, and contextual help.
    - **Executions**: Table view, detailed step-by-step logs with input/output/errors, token usage.
    - **Knowledge Bases**: Card view, document upload, configuration of chunking/embedding.
    - **Templates**: Gallery for agents and workflows.
    - **Integrations**: Marketplace for third-party services, connect/disconnect functionality.
    - **Evaluations**: LangSmith-style monitoring with quality scores, run lists, and metrics.
    - **Feature Requests**: Community feedback system with voting, tracking, and export.
    - **Leaderboard** (`/leaderboard`): Performance ranking of agents by success rate, avg response time, execution count, and cost efficiency. Features sortable columns, provider/status filters, top-3 highlight cards, performance badges, and filtered empty state.
    - **Settings**: Multi-tab configuration for general, LLM providers, MCP, security, API keys, notifications, and advanced options.

### Backend (`artifacts/api-server`)
- **Technology Stack**: Node.js 24, Express 5.
- **API Design**: All routes are mounted under `/api` and provide RESTful access for CRUD operations and specific actions (e.g., run workflow, vote on feature request).
- **AI Integration**: OpenAI via Replit AI Integrations proxy (`@workspace/integrations-openai-ai-server`). Used for prompt optimization (`POST /api/agents/optimize-prompt`). Env vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`.
- **Validation**: Uses Zod schemas generated from the OpenAPI spec (`@workspace/api-zod`) for robust request and response validation.

### Data Layer (`lib/db`)
- **Database**: PostgreSQL with Drizzle ORM.
- **Schema**: Defined in `lib/db/src/schema/` including tables for `agents`, `workflows`, `executions`, `knowledgeBases`, `documents`, `featureRequests`, `evalRuns`, `integrations`, and `settings`.
- **Migrations**: Development uses `drizzle-kit push` for schema synchronization.

### Monorepo Structure & Build System
- **Monorepo Tool**: pnpm workspaces.
- **TypeScript**: Version 5.9, utilizing composite projects and project references for efficient cross-package type-checking (`tsc --build --emitDeclarationOnly`).
- **Build Tool**: esbuild for CJS bundling of the API server.
- **API Codegen**: Orval generates API client hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`) from a central OpenAPI specification (`lib/api-spec/openapi.yaml`).

## Feature Specifications

- **Agent Configuration**: Supports CrewAI-style role assignment, various memory modules (conversational, summary, semantic, persistent), diverse tool selection (web search, code execution, API, SQL, knowledge base, image gen), and guardrails (input/output validation, PII, token limits).
- **Workflow Editor**: Offers 16 node types with distinct icons, descriptions, and color coding. Node configurations are type-specific and include detailed help texts.
- **AI Builder**: Employs a pattern-based generation engine to detect trigger types, agents, conditions, loops, delays, and error handling from natural language.

## System Design Choices

- **Modularity**: The monorepo structure promotes modularity, with `lib/` packages providing shared functionalities (API spec, DB access, generated clients/schemas) consumed by `artifacts/` applications.
- **API-First**: A well-defined OpenAPI specification (`lib/api-spec`) drives frontend-backend contract generation, ensuring consistency and type safety.
- **Scalability**: Designed for horizontal scaling of the API server and supports various database configurations.
- **Extensibility**: The integrations framework and template system are built to easily incorporate new services and pre-configured solutions.

# External Dependencies

The AgentFlow platform integrates with a variety of external services and libraries:

- **Database**: PostgreSQL
- **LLM Providers**: OpenAI, Anthropic, Google AI (via specific API keys configured in settings)
- **Vector Store**: Integrated for knowledge base RAG functionality.
- **Queue**: Used for asynchronous task processing (e.g., workflow executions).
- **Messaging/Communication**: Slack (for notifications).
- **Identity Providers**: SAML/OIDC (for Security & SSO).
- **Third-Party Integrations**: A marketplace of 82+ integrations across 12 categories, including common services for communication, databases, productivity, developer tools, CRM & Sales, cloud storage, analytics, payments, and media. Specific integrations are managed via API keys and connect/disconnect toggles.
- **Cost Forecasting**: 30-day cost forecast on Dashboard using OLS linear regression over daily cost history. API endpoint: `GET /api/analytics/cost-forecast`. Returns 30-day history (with zero-fill for missing days), 30-day forecast, and summary stats (dailyAverage, trend, projected30d, historical30d, trendDirection). Frontend shows ComposedChart with actual (solid) and forecast (dashed amber) lines, summary cards, and trend badge.
- **A/B Testing**: Compare two agent configurations side by side at `/ab-testing`. DB tables: `ab_tests` (test definitions) and `ab_test_results` (per-prompt results). API: `GET/POST /api/ab-tests`, `GET /api/ab-tests/:id`, `POST /api/ab-tests/:id/run`, `DELETE /api/ab-tests/:id`. Running a test sends each prompt to both agents via OpenAI, then uses GPT-4o as a judge to score responses on relevance/coherence/helpfulness/overall (1-10 scale). Frontend shows test list, creation dialog, detail view with agent cards, results summary with score bars, and expandable individual result comparisons.
- **Workflow Version History**: Auto-snapshots workflow definitions on every save. DB table: `workflow_versions` (workflowId, version, label, definition, nodeCount, edgeCount). API: `GET /api/workflows/:id/versions`, `GET /api/workflows/:id/versions/:versionId`, `POST /api/workflows/:id/versions/:versionId/restore`, `PUT /api/workflows/:id/versions/:versionId` (rename label). Restore creates a "before restore" snapshot first. Frontend: "History" button in workflow editor toolbar opens a right-side panel showing version list with node/edge counts, version preview with node details, and one-click restore.
- **Smart Workflow Suggestions**: AI-powered workflow optimization analysis. API: `POST /api/workflows/:id/suggestions` sends workflow definition (nodes, edges, stats) to GPT-4o for analysis. Returns suggestions array (category, title, description, impact, nodeIds), overallScore (0-100), summary, and tokensUsed. Categories: PERFORMANCE, RELIABILITY, COST, STRUCTURE, BEST_PRACTICES. Frontend: "Optimize" button in workflow editor toolbar opens AI Suggestions panel with health score, sorted suggestion cards (by impact), re-analyze capability.
- **Agent Health Monitor**: Per-agent health status with real-time pinging. DB columns added to `agents`: `lastPingAt`, `healthStatus` (healthy/degraded/unhealthy/unknown), `healthMessage`, `healthLatency`. API: `POST /api/agents/:id/ping` (sends test message to agent's AI model, measures latency, updates health), `GET /api/agents/:id/health` (returns cached health). Frontend: `HealthIndicator` component on each agent card with clickable status dot, color-coded health (green/amber/red/grey), latency display, relative time since last check, and toast notifications.
- **Auto-Retry Configuration**: Per-step retry settings in workflow builder (non-trigger nodes only). Collapsible "Auto-Retry Configuration" section in NodeConfigPanel with: enable toggle (`retryEnabled`), max retries slider (1-10, `retryMaxAttempts`), backoff strategy (`fixed`/`linear`/`exponential`, `retryBackoff`), initial delay seconds (`retryDelay`), retry-on conditions (`any_error`/`timeout`/`rate_limit`/`server_error`/`custom`, `retryOn`), custom error codes (`retryErrorCodes`). Live retry preview shows calculated delays and total max wait. Retry badge displayed on canvas nodes. Temp UI state (`_retryExpanded`) stripped during save.
- **Monitoring/Evaluation**: LangSmith-style evaluation metrics.
- **Core Libraries**:
    - `@xyflow/react` (React Flow) for workflow canvas.
    - `recharts` for data visualization.
    - `framer-motion` for animations.
    - `pnpm` for workspace management.
    - `TypeScript` as the primary language.
    - `Express` for API server.
    - `Drizzle ORM` for database interaction.
    - `Zod` for schema validation.
    - `Orval` for API client generation.
    - `esbuild` for bundling.
    - `Vite` for frontend development.
    - `Tailwind CSS v4` for styling.
    - `shadcn/ui` for UI components.
    - `wouter` for client-side routing.