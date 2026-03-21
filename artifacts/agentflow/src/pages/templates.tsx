import { useState } from "react";
import { useListTemplates, useApplyTemplate } from "@workspace/api-client-react";
import { Blocks, Copy, Sparkles, Info, Bot, Workflow, Tag, Star, ArrowRight, Store, Users, Download, Heart, Eye, Shield, Globe, Zap, Brain, Code2, Headphones, Mail, BarChart2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 border border-white/5 bg-secondary/20 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 w-16 bg-secondary/50 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-secondary/50 rounded mb-2" />
      <div className="space-y-1.5 mb-6">
        <div className="h-3 w-full bg-secondary/50 rounded" />
        <div className="h-3 w-2/3 bg-secondary/50 rounded" />
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="flex gap-1.5">
          <div className="h-5 w-14 bg-secondary/50 rounded" />
          <div className="h-5 w-14 bg-secondary/50 rounded" />
        </div>
        <div className="h-8 w-16 bg-secondary/50 rounded" />
      </div>
    </div>
  );
}

const marketplaceAgents = [
  {
    id: "mp-1", name: "SEO Content Writer", author: "ContentAI Labs", description: "Generates SEO-optimized blog posts, meta descriptions, and title tags. Trained on top-ranking content patterns across 50+ industries.",
    downloads: 12400, rating: 4.8, reviews: 342, category: "content", model: "gpt-4o",
    tags: ["seo", "content", "writing"], icon: "writing", verified: true,
  },
  {
    id: "mp-2", name: "Code Reviewer Pro", author: "DevTools Inc.", description: "Reviews pull requests for bugs, security vulnerabilities, and performance issues. Supports Python, TypeScript, Go, and Rust with framework-specific knowledge.",
    downloads: 8900, rating: 4.9, reviews: 201, category: "engineering", model: "claude-3.5-sonnet",
    tags: ["code-review", "security", "devops"], icon: "code", verified: true,
  },
  {
    id: "mp-3", name: "Customer Sentiment Analyzer", author: "SupportAI", description: "Analyzes customer feedback from tickets, surveys, and social media. Classifies sentiment, extracts key themes, and generates actionable insights.",
    downloads: 6700, rating: 4.6, reviews: 178, category: "support", model: "gpt-4o-mini",
    tags: ["sentiment", "analytics", "support"], icon: "support", verified: true,
  },
  {
    id: "mp-4", name: "Legal Contract Summarizer", author: "LegalMind AI", description: "Extracts key terms, obligations, deadlines, and risk areas from legal contracts. Generates executive summaries and comparison tables.",
    downloads: 5200, rating: 4.7, reviews: 156, category: "legal", model: "gpt-4o",
    tags: ["legal", "contracts", "compliance"], icon: "shield", verified: false,
  },
  {
    id: "mp-5", name: "Data Pipeline Debugger", author: "DataOps Team", description: "Diagnoses issues in ETL/ELT pipelines, suggests SQL optimizations, and identifies data quality problems. Integrates with dbt and Airflow logs.",
    downloads: 4100, rating: 4.5, reviews: 98, category: "engineering", model: "claude-3.5-sonnet",
    tags: ["data", "sql", "debugging"], icon: "data", verified: true,
  },
  {
    id: "mp-6", name: "Sales Email Composer", author: "GrowthBot", description: "Crafts personalized cold outreach emails, follow-ups, and nurture sequences. Uses prospect research data to customize messaging and tone.",
    downloads: 9800, rating: 4.4, reviews: 267, category: "sales", model: "gpt-4o-mini",
    tags: ["email", "sales", "outreach"], icon: "email", verified: false,
  },
  {
    id: "mp-7", name: "Financial Report Analyst", author: "FinanceAI Co.", description: "Parses earnings reports, 10-K filings, and balance sheets. Extracts KPIs, calculates ratios, and generates investment summaries.",
    downloads: 3800, rating: 4.8, reviews: 134, category: "finance", model: "gpt-4o",
    tags: ["finance", "analysis", "reports"], icon: "chart", verified: true,
  },
  {
    id: "mp-8", name: "Multi-Language Translator", author: "LinguaFlow", description: "Context-aware translation across 40+ languages. Preserves tone, idioms, and cultural nuances. Supports technical, medical, and legal terminology.",
    downloads: 11200, rating: 4.7, reviews: 445, category: "content", model: "gpt-4o",
    tags: ["translation", "multilingual", "localization"], icon: "globe", verified: true,
  },
  {
    id: "mp-9", name: "Meeting Minutes Generator", author: "ProductivityAI", description: "Converts meeting transcripts into structured minutes with action items, decisions, and follow-ups. Identifies speakers and key discussion points.",
    downloads: 7600, rating: 4.6, reviews: 312, category: "productivity", model: "gpt-4o-mini",
    tags: ["meetings", "productivity", "notes"], icon: "brain", verified: false,
  },
];

const categoryOptions = ["all", "content", "engineering", "support", "legal", "sales", "finance", "productivity"];

const iconMap: Record<string, any> = {
  writing: Sparkles, code: Code2, support: Headphones, shield: Shield,
  data: BarChart2, email: Mail, chart: BarChart2, globe: Globe, brain: Brain,
};

export default function Templates() {
  const [activeTab, setActiveTab] = useState<"templates" | "marketplace">("templates");
  const { data: templates, isLoading } = useListTemplates();

  const agentTemplates = templates?.filter(t => t.category === 'agent') || [];
  const workflowTemplates = templates?.filter(t => t.category === 'workflow') || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Sparkles className="w-32 h-32 text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Template Gallery</h1>
          <p className="text-muted-foreground text-lg mb-2">Jumpstart your development with pre-configured agents and workflows curated by experts.</p>
          <p className="text-sm text-muted-foreground">Click "Use" on any template to instantly create a ready-to-use agent or workflow. You can customize it after applying.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "templates" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Blocks className="w-4 h-4" /> Templates
        </button>
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "marketplace" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Store className="w-4 h-4" /> Marketplace
        </button>
      </div>

      {activeTab === "templates" && (
        <>
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p><strong className="text-foreground">How templates work:</strong> Templates are pre-built configurations that create real agents or workflows in your account with one click. After applying a template, you own the result and can modify it however you like. Think of templates as starting points, not fixed solutions.</p>
            </div>
          </div>

          {isLoading ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-secondary/50 rounded animate-pulse" />
                  <div className="h-6 w-40 bg-secondary/50 rounded animate-pulse" />
                </div>
                <div className="h-4 w-80 bg-secondary/30 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-secondary/50 rounded animate-pulse" />
                  <div className="h-6 w-48 bg-secondary/50 rounded animate-pulse" />
                </div>
                <div className="h-4 w-96 bg-secondary/30 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </div>
            </>
          ) : (
            <>
              {agentTemplates.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-400" />
                    Agent Templates
                  </h2>
                  <p className="text-sm text-muted-foreground">Pre-configured AI agents ready to use. Each comes with a system prompt, model settings, and tool assignments.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agentTemplates.map(t => (
                      <TemplateCard key={t.id} template={t} />
                    ))}
                  </div>
                </div>
              )}

              {workflowTemplates.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-purple-400" />
                    Workflow Templates
                  </h2>
                  <p className="text-sm text-muted-foreground">Complete automated pipelines with multiple connected steps. Apply one and open it in the visual builder to customize.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflowTemplates.map(t => (
                      <TemplateCard key={t.id} template={t} />
                    ))}
                  </div>
                </div>
              )}

              {(!templates || templates.length === 0) && (
                <div className="text-center py-16 glass-card rounded-3xl">
                  <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No templates available</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Templates will appear here as they are added to the platform.</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === "marketplace" && <MarketplaceTab />}
    </div>
  );
}

function MarketplaceTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"downloads" | "rating">("downloads");
  const { toast } = useToast();

  const filtered = marketplaceAgents
    .filter(a => category === "all" || a.category === category)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.includes(search.toLowerCase())))
    .sort((a, b) => sortBy === "downloads" ? b.downloads - a.downloads : b.rating - a.rating);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/10 rounded-xl p-4 flex gap-3 items-start">
        <Store className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p><strong className="text-foreground">Agent Marketplace:</strong> Browse community-shared agents built by other AgentFlow users and teams. These are read-only previews — use "Preview" to see the full configuration before deciding to replicate one in your workspace.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplace agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
          >
            {categoryOptions.map(c => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
          >
            <option value="downloads">Most Downloads</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} agent{filtered.length !== 1 ? "s" : ""} found</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(agent => (
          <MarketplaceCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 glass-card rounded-3xl">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No agents found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your search or category filter.</p>
        </div>
      )}
    </div>
  );
}

function MarketplaceCard({ agent }: { agent: typeof marketplaceAgents[0] }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const Icon = iconMap[agent.icon] || Bot;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col group border border-white/5 hover:border-amber-500/30 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">{agent.name}</h3>
            {agent.verified && (
              <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" title="Verified" />
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> {agent.author}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">{agent.description}</p>

      <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" /> {agent.downloads >= 1000 ? `${(agent.downloads / 1000).toFixed(1)}k` : agent.downloads}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {agent.rating}
        </span>
        <span>({agent.reviews} reviews)</span>
        <Badge variant="outline" className="text-[9px] ml-auto">{agent.model}</Badge>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex gap-1.5 flex-wrap">
          {agent.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-white/5">
              {tag}
            </span>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-500/20 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300"
          onClick={() => {
            setExpanded(!expanded);
            toast({ title: `Previewing ${agent.name}`, description: "This is a read-only marketplace preview." });
          }}
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{agent.model}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{agent.category}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-muted-foreground">Downloads</p>
              <p className="font-medium">{agent.downloads.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-muted-foreground">Rating</p>
              <p className="font-medium flex items-center gap-1">
                {agent.rating} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              </p>
            </div>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Tags</p>
            <div className="flex gap-1.5 flex-wrap">
              {agent.tags.map(tag => (
                <span key={tag} className="text-[10px] text-foreground bg-background px-2 py-0.5 rounded border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {agent.verified ? "Verified by AgentFlow team" : "Community contributed"} — read-only preview
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: any }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useApplyTemplate({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Template applied successfully! Redirecting..." });
        if (data.workflowId) setLocation(`/workflows/${data.workflowId}/edit`);
        else if (data.agentId) setLocation('/agents');
      },
      onError: () => toast({ title: "Failed to apply template", variant: "destructive" })
    }
  });

  const categoryColor = template.category === 'agent' 
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col group border border-white/5 hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${categoryColor}`}>
          {template.category}
        </span>
      </div>
      <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
      <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-3">{template.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex gap-1.5 flex-wrap">
          {template.tags?.slice(0,2).map((tag: string) => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded border border-white/5 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
        <Button 
          size="sm" 
          className="bg-white/10 hover:bg-primary hover:text-white text-foreground transition-colors"
          onClick={() => mutate({ templateId: template.id })}
          disabled={isPending}
        >
          {isPending ? "Applying..." : (
            <>
              <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Use
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
