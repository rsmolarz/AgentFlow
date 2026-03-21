import { pool } from "./index";

export async function ensureTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS eval_runs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        agent_id INTEGER,
        agent_name TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        score REAL DEFAULT 0,
        total_tests INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        avg_latency REAL DEFAULT 0,
        token_usage INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        metrics JSONB DEFAULT '{"accuracy":0,"relevance":0,"coherence":0,"safety":0}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        connected BOOLEAN DEFAULT false,
        api_key TEXT,
        popular BOOLEAN DEFAULT false,
        nodes INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value JSONB DEFAULT '{}',
        category TEXT NOT NULL DEFAULT 'general',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ab_tests (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        agent_a_id INTEGER NOT NULL REFERENCES agents(id),
        agent_b_id INTEGER NOT NULL REFERENCES agents(id),
        test_prompts JSONB DEFAULT '[]',
        total_runs INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ab_test_results (
        id SERIAL PRIMARY KEY,
        test_id INTEGER NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        agent_a_response TEXT DEFAULT '',
        agent_b_response TEXT DEFAULT '',
        agent_a_tokens INTEGER DEFAULT 0,
        agent_b_tokens INTEGER DEFAULT 0,
        agent_a_duration REAL DEFAULT 0,
        agent_b_duration REAL DEFAULT 0,
        agent_a_cost REAL DEFAULT 0,
        agent_b_cost REAL DEFAULT 0,
        winner TEXT DEFAULT '',
        scores JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workflow_versions (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1,
        label TEXT DEFAULT '',
        definition JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
        node_count INTEGER DEFAULT 0,
        edge_count INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bulk_executions (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        workflow_name TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        total_rows INTEGER DEFAULT 0,
        completed_rows INTEGER DEFAULT 0,
        failed_rows INTEGER DEFAULT 0,
        headers JSONB DEFAULT '[]',
        results JSONB DEFAULT '[]',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        duration REAL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workflow_schedules (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        cron_expression TEXT NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'UTC',
        enabled BOOLEAN NOT NULL DEFAULT true,
        label TEXT DEFAULT '',
        last_run_at TIMESTAMP,
        next_run_at TIMESTAMP,
        run_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
        method TEXT NOT NULL DEFAULT 'POST',
        enabled BOOLEAN NOT NULL DEFAULT true,
        secret TEXT,
        description TEXT DEFAULT '',
        last_called_at TIMESTAMP,
        call_count INTEGER NOT NULL DEFAULT 0,
        last_payload JSONB,
        last_status TEXT DEFAULT 'never',
        headers JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cost_alerts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        budget_amount NUMERIC(12,2) NOT NULL,
        current_spend NUMERIC(12,2) NOT NULL DEFAULT 0,
        alert_threshold INTEGER NOT NULL DEFAULT 80,
        enabled BOOLEAN NOT NULL DEFAULT true,
        alert_type TEXT NOT NULL DEFAULT 'monthly',
        notify_email BOOLEAN NOT NULL DEFAULT true,
        notify_in_app BOOLEAN NOT NULL DEFAULT true,
        triggered BOOLEAN NOT NULL DEFAULT false,
        triggered_at TIMESTAMP,
        reset_day INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'general',
        tags JSONB DEFAULT '[]',
        description VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
      ALTER TABLE agents ADD COLUMN IF NOT EXISTS safety_filter BOOLEAN DEFAULT false;
    `);

    await client.query("UPDATE integrations SET connected = false, api_key = NULL WHERE api_key IS NULL AND connected = true");

    await client.query("DELETE FROM eval_runs WHERE agent_id IS NULL AND name IN ('Customer Support Quality','Code Review Accuracy','Content Generation Quality','Data Analysis Precision','Prompt Iteration v3.2')");

    const { rows } = await client.query("SELECT COUNT(*) as cnt FROM integrations");
    if (Number(rows[0].cnt) === 0) {
      const integrations = [
        ["OpenAI","GPT-4o, GPT-4, DALL-E, Whisper, and embeddings","llm","🤖",false,true,8],
        ["Anthropic","Claude 3.5 Sonnet, Claude 3 Opus, and Haiku models","llm","🧠",false,true,5],
        ["Google AI","Gemini Pro, Gemini Flash, PaLM, and embeddings","llm","✨",false,false,6],
        ["Mistral AI","Mistral Large, Medium, and Codestral models","llm","🌪️",false,false,4],
        ["Cohere","Command R+, embeddings, and reranking models","llm","💎",false,false,4],
        ["Hugging Face","Access 100k+ open-source models and inference API","llm","🤗",false,true,3],
        ["Ollama","Run local LLMs — Llama 3, Mistral, CodeLlama","llm","🦙",false,false,3],
        ["Azure OpenAI","Enterprise-grade OpenAI models on Azure","llm","☁️",false,false,5],
        ["AWS Bedrock","Claude, Titan, and Llama on AWS infrastructure","llm","🏔️",false,false,4],
        ["Groq","Ultra-fast inference for Llama and Mixtral","llm","⚡",false,false,2],
        ["Slack","Send messages, manage channels, and respond to events","communication","💬",false,true,12],
        ["Discord","Bot messages, channel management, and reactions","communication","🎮",false,false,8],
        ["Microsoft Teams","Messages, channels, meetings, and adaptive cards","communication","👥",false,false,7],
        ["Telegram","Bot messages, groups, inline queries, and callbacks","communication","📱",false,false,6],
        ["Gmail","Read, send, and manage emails with labels and filters","communication","✉️",false,true,10],
        ["PostgreSQL","Query, insert, update, and manage relational data","database","🐘",false,true,6],
        ["MongoDB","Document operations — find, insert, aggregate, and update","database","🍃",false,false,6],
        ["Redis","Key-value caching, pub/sub, and data structures","database","🔴",false,false,5],
        ["Supabase","Postgres database, auth, storage, and edge functions","database","⚡",false,true,8],
        ["Firebase","Firestore, Realtime DB, auth, and cloud functions","database","🔥",false,false,7],
        ["Airtable","Spreadsheet-database hybrid with rich field types","database","📊",false,true,6],
        ["Notion","Pages, databases, blocks, and workspace management","productivity","📓",false,true,10],
        ["Google Sheets","Read, write, and manage spreadsheet data","productivity","📗",false,true,8],
        ["Jira","Issues, sprints, boards, and project tracking","productivity","🎯",false,false,8],
        ["Linear","Issues, projects, and engineering workflows","productivity","📐",false,false,7],
        ["GitHub","Repos, issues, PRs, actions, and webhooks","developer","🐙",false,true,15],
        ["GitLab","Repositories, CI/CD, issues, and merge requests","developer","🦊",false,false,10],
        ["Vercel","Deployments, domains, and serverless functions","developer","▲",false,false,5],
        ["Salesforce","Leads, contacts, opportunities, and reports","crm","☁️",false,true,12],
        ["HubSpot","CRM, marketing, sales, and service automation","crm","🟠",false,true,14],
        ["AWS S3","Object storage — upload, download, and manage buckets","storage","📦",false,true,6],
        ["Google Drive","Files, folders, sharing, and permissions","storage","📁",false,true,7],
        ["Stripe","Payments, subscriptions, invoices, and customers","payment","💳",false,true,10],
        ["Pinecone","Vector database for high-performance similarity search","vector","🌲",false,true,4],
        ["Weaviate","Open-source vector search engine with hybrid search","vector","🔮",false,false,4],
        ["ChromaDB","Open-source embedding database for AI apps","vector","🎨",false,false,3],
        ["Stability AI","Stable Diffusion image generation and editing","media","🎨",false,false,3],
        ["ElevenLabs","AI voice synthesis, cloning, and text-to-speech","media","🎙️",false,false,3],
      ];
      for (const [name, desc, cat, icon, connected, popular, nodes] of integrations) {
        await client.query(
          `INSERT INTO integrations (name, description, category, icon, connected, popular, nodes) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (name) DO NOTHING`,
          [name, desc, cat, icon, connected, popular, nodes]
        );
      }
      console.log(`Seeded ${integrations.length} integrations`);
    }

    console.log("Database tables verified/created successfully");
  } catch (err) {
    console.error("Error ensuring tables:", err);
  } finally {
    client.release();
  }
}
