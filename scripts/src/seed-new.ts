import { db } from "@workspace/db";
import { integrationsTable } from "@workspace/db/schema";

async function seedNew() {
  console.log("Seeding integrations...");

  const integrations = [
    { name: "OpenAI", description: "GPT-4o, GPT-4, DALL-E, Whisper, and embeddings", category: "llm", icon: "🤖", connected: true, popular: true, nodes: 8 },
    { name: "Anthropic", description: "Claude 3.5 Sonnet, Claude 3 Opus, and Haiku models", category: "llm", icon: "🧠", connected: true, popular: true, nodes: 5 },
    { name: "Google AI", description: "Gemini Pro, Gemini Flash, PaLM, and embeddings", category: "llm", icon: "✨", connected: true, popular: false, nodes: 6 },
    { name: "Mistral AI", description: "Mistral Large, Medium, and Codestral models", category: "llm", icon: "🌪️", connected: false, popular: false, nodes: 4 },
    { name: "Cohere", description: "Command R+, embeddings, and reranking models", category: "llm", icon: "💎", connected: false, popular: false, nodes: 4 },
    { name: "Hugging Face", description: "Access 100k+ open-source models and inference API", category: "llm", icon: "🤗", connected: false, popular: true, nodes: 3 },
    { name: "Ollama", description: "Run local LLMs — Llama 3, Mistral, CodeLlama", category: "llm", icon: "🦙", connected: false, popular: false, nodes: 3 },
    { name: "Azure OpenAI", description: "Enterprise-grade OpenAI models on Azure", category: "llm", icon: "☁️", connected: false, popular: false, nodes: 5 },
    { name: "AWS Bedrock", description: "Claude, Titan, and Llama on AWS infrastructure", category: "llm", icon: "🏔️", connected: false, popular: false, nodes: 4 },
    { name: "Groq", description: "Ultra-fast inference for Llama and Mixtral", category: "llm", icon: "⚡", connected: false, popular: false, nodes: 2 },
    { name: "Together AI", description: "Fast open-source model inference", category: "llm", icon: "🔗", connected: false, popular: false, nodes: 3 },
    { name: "Replicate", description: "Run ML models via API — image, text, video", category: "llm", icon: "🔄", connected: false, popular: false, nodes: 2 },
    { name: "Slack", description: "Send messages, manage channels, and respond to events", category: "communication", icon: "💬", connected: true, popular: true, nodes: 12 },
    { name: "Discord", description: "Bot messages, channel management, and reactions", category: "communication", icon: "🎮", connected: false, popular: false, nodes: 8 },
    { name: "Microsoft Teams", description: "Messages, channels, meetings, and adaptive cards", category: "communication", icon: "👥", connected: false, popular: false, nodes: 7 },
    { name: "Telegram", description: "Bot messages, groups, inline queries, and callbacks", category: "communication", icon: "📱", connected: false, popular: false, nodes: 6 },
    { name: "WhatsApp", description: "Business API messages, templates, and media", category: "communication", icon: "📲", connected: false, popular: false, nodes: 5 },
    { name: "Twilio", description: "SMS, voice, WhatsApp, and video communications", category: "communication", icon: "📞", connected: false, popular: false, nodes: 8 },
    { name: "SendGrid", description: "Transactional and marketing email delivery", category: "communication", icon: "📧", connected: false, popular: false, nodes: 6 },
    { name: "Intercom", description: "Customer messaging, live chat, and help desk", category: "communication", icon: "💁", connected: false, popular: false, nodes: 7 },
    { name: "Gmail", description: "Read, send, and manage emails with labels and filters", category: "communication", icon: "✉️", connected: true, popular: true, nodes: 10 },
    { name: "Outlook", description: "Microsoft email, calendar, and contacts", category: "communication", icon: "📮", connected: false, popular: false, nodes: 8 },
    { name: "PostgreSQL", description: "Query, insert, update, and manage relational data", category: "database", icon: "🐘", connected: true, popular: true, nodes: 6 },
    { name: "MySQL", description: "Full SQL operations on MySQL and MariaDB", category: "database", icon: "🐬", connected: false, popular: false, nodes: 5 },
    { name: "MongoDB", description: "Document operations — find, insert, aggregate, and update", category: "database", icon: "🍃", connected: false, popular: false, nodes: 6 },
    { name: "Redis", description: "Key-value caching, pub/sub, and data structures", category: "database", icon: "🔴", connected: false, popular: false, nodes: 5 },
    { name: "Supabase", description: "Postgres database, auth, storage, and edge functions", category: "database", icon: "⚡", connected: false, popular: true, nodes: 8 },
    { name: "Firebase", description: "Firestore, Realtime DB, auth, and cloud functions", category: "database", icon: "🔥", connected: false, popular: false, nodes: 7 },
    { name: "Airtable", description: "Spreadsheet-database hybrid with rich field types", category: "database", icon: "📊", connected: false, popular: true, nodes: 6 },
    { name: "DynamoDB", description: "AWS managed NoSQL with single-digit millisecond latency", category: "database", icon: "📦", connected: false, popular: false, nodes: 4 },
    { name: "Notion", description: "Pages, databases, blocks, and workspace management", category: "productivity", icon: "📓", connected: false, popular: true, nodes: 10 },
    { name: "Google Sheets", description: "Read, write, and manage spreadsheet data", category: "productivity", icon: "📗", connected: true, popular: true, nodes: 8 },
    { name: "Google Docs", description: "Create, read, and edit documents", category: "productivity", icon: "📄", connected: false, popular: false, nodes: 5 },
    { name: "Google Calendar", description: "Events, scheduling, and availability", category: "productivity", icon: "📅", connected: false, popular: false, nodes: 6 },
    { name: "Asana", description: "Tasks, projects, and team collaboration", category: "productivity", icon: "🏗️", connected: false, popular: false, nodes: 7 },
    { name: "Trello", description: "Boards, lists, cards, and automations", category: "productivity", icon: "📋", connected: false, popular: false, nodes: 6 },
    { name: "Jira", description: "Issues, sprints, boards, and project tracking", category: "productivity", icon: "🎯", connected: false, popular: false, nodes: 8 },
    { name: "Linear", description: "Issues, projects, and engineering workflows", category: "productivity", icon: "📐", connected: false, popular: false, nodes: 7 },
    { name: "ClickUp", description: "Tasks, docs, goals, and dashboards", category: "productivity", icon: "✅", connected: false, popular: false, nodes: 6 },
    { name: "GitHub", description: "Repos, issues, PRs, actions, and webhooks", category: "developer", icon: "🐙", connected: true, popular: true, nodes: 15 },
    { name: "GitLab", description: "Repositories, CI/CD, issues, and merge requests", category: "developer", icon: "🦊", connected: false, popular: false, nodes: 10 },
    { name: "Vercel", description: "Deployments, domains, and serverless functions", category: "developer", icon: "▲", connected: false, popular: false, nodes: 5 },
    { name: "Sentry", description: "Error tracking, performance monitoring, and alerts", category: "developer", icon: "🛡️", connected: false, popular: false, nodes: 4 },
    { name: "Salesforce", description: "Leads, contacts, opportunities, and reports", category: "crm", icon: "☁️", connected: false, popular: true, nodes: 12 },
    { name: "HubSpot", description: "CRM, marketing, sales, and service automation", category: "crm", icon: "🟠", connected: false, popular: true, nodes: 14 },
    { name: "Pipedrive", description: "Deals, contacts, activities, and sales pipeline", category: "crm", icon: "🔵", connected: false, popular: false, nodes: 7 },
    { name: "AWS S3", description: "Object storage — upload, download, and manage buckets", category: "storage", icon: "📦", connected: false, popular: true, nodes: 6 },
    { name: "Google Drive", description: "Files, folders, sharing, and permissions", category: "storage", icon: "📁", connected: false, popular: true, nodes: 7 },
    { name: "Dropbox", description: "File storage, sharing, and team folders", category: "storage", icon: "📥", connected: false, popular: false, nodes: 5 },
    { name: "Mixpanel", description: "Product analytics, funnels, and user retention", category: "analytics", icon: "📊", connected: false, popular: false, nodes: 4 },
    { name: "Segment", description: "Customer data platform — collect, route, and activate", category: "analytics", icon: "🟢", connected: false, popular: false, nodes: 5 },
    { name: "Stripe", description: "Payments, subscriptions, invoices, and customers", category: "payment", icon: "💳", connected: false, popular: true, nodes: 10 },
    { name: "PayPal", description: "Payments, orders, and subscription management", category: "payment", icon: "🅿️", connected: false, popular: false, nodes: 5 },
    { name: "Pinecone", description: "Vector database for high-performance similarity search", category: "vector", icon: "🌲", connected: true, popular: true, nodes: 4 },
    { name: "Weaviate", description: "Open-source vector search engine with hybrid search", category: "vector", icon: "🔮", connected: false, popular: false, nodes: 4 },
    { name: "Qdrant", description: "High-performance vector similarity search engine", category: "vector", icon: "🎯", connected: false, popular: false, nodes: 4 },
    { name: "ChromaDB", description: "Open-source embedding database for AI apps", category: "vector", icon: "🎨", connected: false, popular: false, nodes: 3 },
    { name: "pgvector", description: "PostgreSQL extension for vector similarity search", category: "vector", icon: "🐘", connected: true, popular: false, nodes: 2 },
    { name: "Stability AI", description: "Stable Diffusion image generation and editing", category: "media", icon: "🎨", connected: false, popular: false, nodes: 3 },
    { name: "ElevenLabs", description: "AI voice synthesis, cloning, and text-to-speech", category: "media", icon: "🎙️", connected: false, popular: false, nodes: 3 },
    { name: "Cloudinary", description: "Image and video management, transformation", category: "media", icon: "🌤️", connected: false, popular: false, nodes: 4 },
    { name: "YouTube", description: "Video data, channel management, and analytics", category: "media", icon: "📹", connected: false, popular: false, nodes: 5 },
  ];

  await db.insert(integrationsTable).values(integrations);

  console.log(`Seeded ${integrations.length} integrations`);
  process.exit(0);
}

seedNew().catch(err => { console.error(err); process.exit(1); });
