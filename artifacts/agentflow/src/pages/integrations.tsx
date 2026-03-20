import { useState } from "react";
import { 
  Search, Plug, Check, ExternalLink, Star, Filter,
  MessageSquare, Mail, Database, Globe, Code2, Brain,
  CreditCard, FileText, Cloud, BarChart3, Shield, Users,
  Calendar, Image, Video, Phone, Boxes, Zap, BookOpen,
  GitBranch, Terminal, Webhook, HardDrive, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "all", label: "All", icon: Boxes },
  { id: "llm", label: "LLM Providers", icon: Brain },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "database", label: "Databases", icon: Database },
  { id: "productivity", label: "Productivity", icon: Calendar },
  { id: "developer", label: "Developer Tools", icon: Code2 },
  { id: "crm", label: "CRM & Sales", icon: Users },
  { id: "storage", label: "Cloud Storage", icon: Cloud },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "payment", label: "Payments", icon: CreditCard },
  { id: "vector", label: "Vector Stores", icon: Layers },
  { id: "media", label: "Media", icon: Image },
];

interface Integration {
  name: string;
  description: string;
  category: string;
  icon: string;
  connected: boolean;
  popular?: boolean;
  nodes?: number;
}

const INTEGRATIONS: Integration[] = [
  { name: "OpenAI", description: "GPT-4o, GPT-4, DALL-E, Whisper, and embeddings", category: "llm", icon: "🤖", connected: true, popular: true, nodes: 8 },
  { name: "Anthropic", description: "Claude 3.5 Sonnet, Claude 3 Opus, and Haiku models", category: "llm", icon: "🧠", connected: true, popular: true, nodes: 5 },
  { name: "Google AI", description: "Gemini Pro, Gemini Flash, PaLM, and embeddings", category: "llm", icon: "✨", connected: true, nodes: 6 },
  { name: "Mistral AI", description: "Mistral Large, Medium, and Codestral models", category: "llm", icon: "🌪️", connected: false, nodes: 4 },
  { name: "Cohere", description: "Command R+, embeddings, and reranking models", category: "llm", icon: "💎", connected: false, nodes: 4 },
  { name: "Hugging Face", description: "Access 100k+ open-source models and inference API", category: "llm", icon: "🤗", connected: false, popular: true, nodes: 3 },
  { name: "Ollama", description: "Run local LLMs — Llama 3, Mistral, CodeLlama", category: "llm", icon: "🦙", connected: false, nodes: 3 },
  { name: "Azure OpenAI", description: "Enterprise-grade OpenAI models on Azure", category: "llm", icon: "☁️", connected: false, nodes: 5 },
  { name: "AWS Bedrock", description: "Claude, Titan, and Llama on AWS infrastructure", category: "llm", icon: "🏔️", connected: false, nodes: 4 },
  { name: "Groq", description: "Ultra-fast inference for Llama and Mixtral", category: "llm", icon: "⚡", connected: false, nodes: 2 },
  { name: "Together AI", description: "Fast open-source model inference", category: "llm", icon: "🔗", connected: false, nodes: 3 },
  { name: "Replicate", description: "Run ML models via API — image, text, video", category: "llm", icon: "🔄", connected: false, nodes: 2 },

  { name: "Slack", description: "Send messages, manage channels, and respond to events", category: "communication", icon: "💬", connected: true, popular: true, nodes: 12 },
  { name: "Discord", description: "Bot messages, channel management, and reactions", category: "communication", icon: "🎮", connected: false, nodes: 8 },
  { name: "Microsoft Teams", description: "Messages, channels, meetings, and adaptive cards", category: "communication", icon: "👥", connected: false, nodes: 7 },
  { name: "Telegram", description: "Bot messages, groups, inline queries, and callbacks", category: "communication", icon: "📱", connected: false, nodes: 6 },
  { name: "WhatsApp", description: "Business API messages, templates, and media", category: "communication", icon: "📲", connected: false, nodes: 5 },
  { name: "Twilio", description: "SMS, voice, WhatsApp, and video communications", category: "communication", icon: "📞", connected: false, nodes: 8 },
  { name: "SendGrid", description: "Transactional and marketing email delivery", category: "communication", icon: "📧", connected: false, nodes: 6 },
  { name: "Intercom", description: "Customer messaging, live chat, and help desk", category: "communication", icon: "💁", connected: false, nodes: 7 },

  { name: "Gmail", description: "Read, send, and manage emails with labels and filters", category: "communication", icon: "✉️", connected: true, popular: true, nodes: 10 },
  { name: "Outlook", description: "Microsoft email, calendar, and contacts", category: "communication", icon: "📮", connected: false, nodes: 8 },

  { name: "PostgreSQL", description: "Query, insert, update, and manage relational data", category: "database", icon: "🐘", connected: true, popular: true, nodes: 6 },
  { name: "MySQL", description: "Full SQL operations on MySQL and MariaDB", category: "database", icon: "🐬", connected: false, nodes: 5 },
  { name: "MongoDB", description: "Document operations — find, insert, aggregate, and update", category: "database", icon: "🍃", connected: false, nodes: 6 },
  { name: "Redis", description: "Key-value caching, pub/sub, and data structures", category: "database", icon: "🔴", connected: false, nodes: 5 },
  { name: "Supabase", description: "Postgres database, auth, storage, and edge functions", category: "database", icon: "⚡", connected: false, popular: true, nodes: 8 },
  { name: "Firebase", description: "Firestore, Realtime DB, auth, and cloud functions", category: "database", icon: "🔥", connected: false, nodes: 7 },
  { name: "Airtable", description: "Spreadsheet-database hybrid with rich field types", category: "database", icon: "📊", connected: false, popular: true, nodes: 6 },
  { name: "DynamoDB", description: "AWS managed NoSQL with single-digit millisecond latency", category: "database", icon: "📦", connected: false, nodes: 4 },

  { name: "Notion", description: "Pages, databases, blocks, and workspace management", category: "productivity", icon: "📓", connected: false, popular: true, nodes: 10 },
  { name: "Google Sheets", description: "Read, write, and manage spreadsheet data", category: "productivity", icon: "📗", connected: true, popular: true, nodes: 8 },
  { name: "Google Docs", description: "Create, read, and edit documents", category: "productivity", icon: "📄", connected: false, nodes: 5 },
  { name: "Google Calendar", description: "Events, scheduling, and availability", category: "productivity", icon: "📅", connected: false, nodes: 6 },
  { name: "Asana", description: "Tasks, projects, and team collaboration", category: "productivity", icon: "🏗️", connected: false, nodes: 7 },
  { name: "Trello", description: "Boards, lists, cards, and automations", category: "productivity", icon: "📋", connected: false, nodes: 6 },
  { name: "Jira", description: "Issues, sprints, boards, and project tracking", category: "productivity", icon: "🎯", connected: false, nodes: 8 },
  { name: "Linear", description: "Issues, projects, and engineering workflows", category: "productivity", icon: "📐", connected: false, nodes: 7 },
  { name: "ClickUp", description: "Tasks, docs, goals, and dashboards", category: "productivity", icon: "✅", connected: false, nodes: 6 },
  { name: "Monday.com", description: "Work management, dashboards, and automations", category: "productivity", icon: "📊", connected: false, nodes: 5 },
  { name: "Todoist", description: "Task management and project organization", category: "productivity", icon: "☑️", connected: false, nodes: 4 },

  { name: "GitHub", description: "Repos, issues, PRs, actions, and webhooks", category: "developer", icon: "🐙", connected: true, popular: true, nodes: 15 },
  { name: "GitLab", description: "Repositories, CI/CD, issues, and merge requests", category: "developer", icon: "🦊", connected: false, nodes: 10 },
  { name: "Bitbucket", description: "Git repositories, pipelines, and pull requests", category: "developer", icon: "🪣", connected: false, nodes: 6 },
  { name: "Vercel", description: "Deployments, domains, and serverless functions", category: "developer", icon: "▲", connected: false, nodes: 5 },
  { name: "Sentry", description: "Error tracking, performance monitoring, and alerts", category: "developer", icon: "🛡️", connected: false, nodes: 4 },
  { name: "PagerDuty", description: "Incident management, alerts, and on-call", category: "developer", icon: "🚨", connected: false, nodes: 5 },
  { name: "Datadog", description: "Monitoring, logging, and APM", category: "developer", icon: "🐕", connected: false, nodes: 4 },
  { name: "Jenkins", description: "CI/CD pipelines, builds, and deployment", category: "developer", icon: "🔨", connected: false, nodes: 3 },

  { name: "Salesforce", description: "Leads, contacts, opportunities, and reports", category: "crm", icon: "☁️", connected: false, popular: true, nodes: 12 },
  { name: "HubSpot", description: "CRM, marketing, sales, and service automation", category: "crm", icon: "🟠", connected: false, popular: true, nodes: 14 },
  { name: "Pipedrive", description: "Deals, contacts, activities, and sales pipeline", category: "crm", icon: "🔵", connected: false, nodes: 7 },
  { name: "Zoho CRM", description: "Leads, deals, contacts, and custom modules", category: "crm", icon: "📊", connected: false, nodes: 8 },
  { name: "Freshsales", description: "Contacts, deals, accounts, and email tracking", category: "crm", icon: "💚", connected: false, nodes: 5 },
  { name: "Close", description: "Leads, activities, and sales communication", category: "crm", icon: "🎯", connected: false, nodes: 4 },

  { name: "AWS S3", description: "Object storage — upload, download, and manage buckets", category: "storage", icon: "📦", connected: false, popular: true, nodes: 6 },
  { name: "Google Drive", description: "Files, folders, sharing, and permissions", category: "storage", icon: "📁", connected: false, popular: true, nodes: 7 },
  { name: "Dropbox", description: "File storage, sharing, and team folders", category: "storage", icon: "📥", connected: false, nodes: 5 },
  { name: "OneDrive", description: "Microsoft cloud storage and file management", category: "storage", icon: "☁️", connected: false, nodes: 4 },
  { name: "Box", description: "Enterprise content management and collaboration", category: "storage", icon: "📦", connected: false, nodes: 5 },

  { name: "Google Analytics", description: "Website traffic, user behavior, and conversions", category: "analytics", icon: "📈", connected: false, nodes: 4 },
  { name: "Mixpanel", description: "Product analytics, funnels, and user retention", category: "analytics", icon: "📊", connected: false, nodes: 4 },
  { name: "Segment", description: "Customer data platform — collect, route, and activate", category: "analytics", icon: "🟢", connected: false, nodes: 5 },
  { name: "Amplitude", description: "Product analytics and user behavior insights", category: "analytics", icon: "📉", connected: false, nodes: 3 },
  { name: "Posthog", description: "Open-source product analytics and feature flags", category: "analytics", icon: "🦔", connected: false, nodes: 4 },

  { name: "Stripe", description: "Payments, subscriptions, invoices, and customers", category: "payment", icon: "💳", connected: false, popular: true, nodes: 10 },
  { name: "PayPal", description: "Payments, orders, and subscription management", category: "payment", icon: "🅿️", connected: false, nodes: 5 },
  { name: "Square", description: "Payments, catalog, customers, and orders", category: "payment", icon: "⬛", connected: false, nodes: 5 },
  { name: "Plaid", description: "Bank connections, transactions, and identity", category: "payment", icon: "🏦", connected: false, nodes: 4 },

  { name: "Pinecone", description: "Vector database for high-performance similarity search", category: "vector", icon: "🌲", connected: true, popular: true, nodes: 4 },
  { name: "Weaviate", description: "Open-source vector search engine with hybrid search", category: "vector", icon: "🔮", connected: false, nodes: 4 },
  { name: "Qdrant", description: "High-performance vector similarity search engine", category: "vector", icon: "🎯", connected: false, nodes: 4 },
  { name: "ChromaDB", description: "Open-source embedding database for AI apps", category: "vector", icon: "🎨", connected: false, nodes: 3 },
  { name: "Milvus", description: "Cloud-native vector database for AI workloads", category: "vector", icon: "🏛️", connected: false, nodes: 3 },
  { name: "pgvector", description: "PostgreSQL extension for vector similarity search", category: "vector", icon: "🐘", connected: true, nodes: 2 },

  { name: "Stability AI", description: "Stable Diffusion image generation and editing", category: "media", icon: "🎨", connected: false, nodes: 3 },
  { name: "ElevenLabs", description: "AI voice synthesis, cloning, and text-to-speech", category: "media", icon: "🎙️", connected: false, nodes: 3 },
  { name: "Cloudinary", description: "Image and video management, transformation", category: "media", icon: "🌤️", connected: false, nodes: 4 },
  { name: "YouTube", description: "Video data, channel management, and analytics", category: "media", icon: "📹", connected: false, nodes: 5 },
  { name: "Spotify", description: "Playlists, tracks, artists, and recommendations", category: "media", icon: "🎵", connected: false, nodes: 4 },
  { name: "Deepgram", description: "Speech-to-text transcription and audio intelligence", category: "media", icon: "🎤", connected: false, nodes: 3 },
  { name: "AssemblyAI", description: "Audio transcription, summarization, and analysis", category: "media", icon: "🔊", connected: false, nodes: 3 },
];

export default function Integrations() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedOverrides, setConnectedOverrides] = useState<Record<string, boolean>>({});

  const filtered = INTEGRATIONS.filter(i => {
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "all" || i.category === category;
    return matchesSearch && matchesCat;
  });

  const isConnected = (name: string, defaultVal: boolean) => connectedOverrides[name] ?? defaultVal;
  const connectedCount = INTEGRATIONS.filter(i => isConnected(i.name, i.connected)).length;
  const totalNodes = INTEGRATIONS.reduce((sum, i) => sum + (i.nodes || 0), 0);

  const handleConnect = (name: string, currentlyConnected: boolean) => {
    setConnectingId(name);
    setTimeout(() => {
      setConnectingId(null);
      setConnectedOverrides(prev => ({ ...prev, [name]: !currentlyConnected }));
      toast({ title: currentlyConnected ? `${name} disconnected` : `${name} connected successfully!` });
    }, 800);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect your agents to {INTEGRATIONS.length}+ services, tools, and APIs. {connectedCount} connected.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg font-medium">
            {connectedCount} Connected
          </div>
          <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg font-medium">
            {totalNodes}+ Nodes
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search integrations... (e.g. Slack, OpenAI, PostgreSQL)" 
          className="pl-9 bg-secondary/50 border-border"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              category === cat.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(integration => (
          <div 
            key={integration.name}
            className={`rounded-xl border p-4 transition-all hover:scale-[1.01] ${
              integration.connected 
                ? 'border-emerald-500/20 bg-emerald-500/5' 
                : 'border-white/5 bg-secondary/20 hover:border-white/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-xl flex-shrink-0">
                {integration.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{integration.name}</h3>
                  {integration.popular && (
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  )}
                  {isConnected(integration.name, integration.connected) && (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                      <Check className="w-2.5 h-2.5" /> Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{integration.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  {integration.nodes && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Boxes className="w-3 h-3" /> {integration.nodes} nodes
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                    <Filter className="w-3 h-3" /> {integration.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                {isConnected(integration.name, integration.connected) ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs border-emerald-500/30 text-emerald-400 hover:border-red-500/30 hover:text-red-400"
                    onClick={() => handleConnect(integration.name, true)}
                    disabled={connectingId === integration.name}
                  >
                    {connectingId === integration.name ? (
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3 animate-spin" /> ...</span>
                    ) : (
                      <><Check className="w-3 h-3 mr-1" /> Active</>
                    )}
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="h-8 text-xs bg-primary/80 hover:bg-primary text-white"
                    onClick={() => handleConnect(integration.name, false)}
                    disabled={connectingId === integration.name}
                  >
                    {connectingId === integration.name ? (
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3 animate-spin" /> ...</span>
                    ) : (
                      <><Plug className="w-3 h-3 mr-1" /> Connect</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-1">No integrations found</h3>
          <p className="text-sm text-muted-foreground">Try a different search term or category filter</p>
        </div>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Need a custom integration?</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
          Use the HTTP Request node or Code node in your workflows to connect to any REST API, GraphQL endpoint, or webhook — no pre-built integration needed.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" className="border-white/10">
            <Webhook className="w-4 h-4 mr-2" /> HTTP Request Node
          </Button>
          <Button variant="outline" className="border-white/10">
            <Terminal className="w-4 h-4 mr-2" /> Code Node
          </Button>
        </div>
      </div>
    </div>
  );
}
