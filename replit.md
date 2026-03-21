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
-   **Execution Replay**: "Re-run" button on each execution row in `/executions` page. Replays the original workflow with the same input data via `POST /api/executions/:id/replay`. Disabled for currently running executions. New execution appears at top of the list after replay.
-   **Cost Alerts**: Budget monitoring in Settings > Notifications. Create alerts with name, budget amount ($), threshold slider (10-100%), and notification preferences (in-app + email). Cards show progress bars (green/amber/red), spend tracking, triggered alerts. Persistent via `cost_alerts` DB table with enable/disable, reset, and delete operations.
-   **Webhook Manager**: Dedicated `/webhooks` page for creating/managing incoming webhook URLs. Features: CRUD operations, unique slug-based URLs, signing secrets with `whsec_` prefix, secret regeneration, test calls, enable/disable toggles, expandable cards with stats/payload viewer, workflow association, secret authentication via `x-webhook-secret` header.
-   **Semantic Search**: AI-powered search bar using OpenAI embeddings (`text-embedding-3-small`) with cosine similarity scoring, fuzzy fallback, ⌘K shortcut, keyboard navigation, dropdown results with match scores.

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