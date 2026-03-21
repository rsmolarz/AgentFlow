import { useState } from "react";
import { Link } from "wouter";
import { 
  useListAgents, 
  useCreateAgent, 
  useDeleteAgent,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, MoreVertical, Search, Trash2, Edit2, Play, BrainCircuit, ActivitySquare, Code2, PenTool, BarChart2, Headphones, Mail, Info, HelpCircle, Thermometer, Brain, Wrench, Shield, Users, MessageSquare, Database, Clock, Layers, GitBranch, Sparkles, Loader2, RotateCcw, Check, Heart, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Agents() {
  const [search, setSearch] = useState("");
  const { data: agents, isLoading } = useListAgents({ search: search || undefined });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient">AI Agents</h1>
          <p className="text-muted-foreground mt-1">Manage your autonomous AI workers. Each agent has its own role, AI model, and set of tools.</p>
        </div>
        
        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search agents..." 
              className="pl-9 bg-secondary/50 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border-0">
                <Plus className="w-4 h-4 mr-2" />
                New Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] bg-card/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Create AI Agent</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Set up a new AI worker with specific capabilities. Fill in the details below — don't worry, you can change everything later.</p>
              </DialogHeader>
              <CreateAgentForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p><strong className="text-foreground">What is an AI Agent?</strong> An agent is like a virtual team member with a specific skill set. You give it a role (like "Data Analyst" or "Content Writer"), choose an AI model (GPT-4, Claude, etc.), and assign tools it can use. Agents can then be added to Workflows to automate complex tasks.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-secondary/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : agents?.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-3xl">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">No agents found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Create your first AI agent to start building automated workflows. An agent is a specialized AI worker that performs specific tasks.</p>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white">Create Your First Agent</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents?.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

const iconMap: Record<string, any> = {
  search: Search,
  code: Code2,
  'pen-tool': PenTool,
  'bar-chart-2': BarChart2,
  headphones: Headphones,
  mail: Mail,
  bot: Bot,
};

function HealthIndicator({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const BASE = import.meta.env.BASE_URL;
  const [pinging, setPinging] = useState(false);
  const [health, setHealth] = useState({
    status: agent.healthStatus || "unknown",
    message: agent.healthMessage || "",
    latency: agent.healthLatency,
    lastPingAt: agent.lastPingAt,
  });

  const ping = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPinging(true);
    try {
      const r = await fetch(`${BASE}api/agents/${agent.id}/ping`, { method: "POST" });
      if (!r.ok) throw new Error("Ping request failed");
      const data = await r.json();
      setHealth({
        status: data.status,
        message: data.message,
        latency: data.latency,
        lastPingAt: data.lastPingAt,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: `Health: ${data.status}`, description: data.message });
    } catch {
      toast({ title: "Ping failed", variant: "destructive" });
    } finally {
      setPinging(false);
    }
  };

  const statusConfig: Record<string, { color: string; bg: string; glow: string; icon: any; label: string }> = {
    healthy: { color: "text-emerald-400", bg: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]", icon: Wifi, label: "Healthy" },
    degraded: { color: "text-amber-400", bg: "bg-amber-500", glow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]", icon: AlertTriangle, label: "Degraded" },
    unhealthy: { color: "text-red-400", bg: "bg-red-500", glow: "shadow-[0_0_8px_rgba(239,68,68,0.5)]", icon: WifiOff, label: "Unhealthy" },
    unknown: { color: "text-muted-foreground", bg: "bg-muted-foreground", glow: "", icon: Heart, label: "Not checked" },
  };

  const cfg = statusConfig[health.status] || statusConfig.unknown;
  const StatusIcon = cfg.icon;
  const timeSince = health.lastPingAt ? (() => {
    const diff = Date.now() - new Date(health.lastPingAt).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  })() : null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={ping}
        disabled={pinging}
        className={`flex items-center gap-1.5 text-xs ${cfg.color} hover:opacity-80 transition-opacity`}
        title={health.message || "Click to ping agent"}
      >
        {pinging ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <div className={`w-2 h-2 rounded-full ${cfg.bg} ${cfg.glow}`} />
        )}
        <span>{pinging ? "Pinging..." : cfg.label}</span>
      </button>
      {health.latency != null && (
        <span className="text-[10px] text-muted-foreground" title={`Response latency: ${health.latency.toFixed(2)}s`}>
          {health.latency.toFixed(1)}s
        </span>
      )}
      {timeSince && (
        <span className="text-[10px] text-muted-foreground" title={`Last checked: ${new Date(health.lastPingAt).toLocaleString()}`}>
          {timeSince}
        </span>
      )}
    </div>
  );
}

function AgentCard({ agent }: { agent: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteAgent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
        toast({ title: "Agent deleted" });
      }
    }
  });

  const getProviderIcon = (provider: string) => {
    switch(provider) {
      case 'openai': return <span className="font-bold text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded" title="OpenAI (GPT models)">GPT</span>;
      case 'anthropic': return <span className="font-bold text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded" title="Anthropic (Claude models)">CLA</span>;
      case 'google': return <span className="font-bold text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded" title="Google (Gemini models)">GEM</span>;
      default: return <BrainCircuit className="w-3 h-3" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-50" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-xl shadow-inner border border-white/5">
            {(() => { const Icon = iconMap[agent.icon] || Bot; return <Icon className="w-6 h-6 text-primary" />; })()}
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {getProviderIcon(agent.provider)}
              <span className="truncate max-w-[100px]">{agent.model}</span>
            </p>
          </div>
        </div>
        
        <HealthIndicator agent={agent} />
      </div>

      <div className="flex-1">
        <p className="text-sm text-foreground/80 line-clamp-2 mb-4">{agent.role || agent.description}</p>
        
        {agent.tools?.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Wrench className="w-3 h-3" /> Tools
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {agent.tools?.slice(0, 3).map((tool: string) => (
                <span key={tool} className="text-[10px] px-2 py-1 bg-secondary rounded-md border border-white/5 text-muted-foreground">
                  {tool}
                </span>
              ))}
              {(agent.tools?.length || 0) > 3 && (
                <span className="text-[10px] px-2 py-1 bg-secondary rounded-md border border-white/5 text-muted-foreground">
                  +{(agent.tools?.length || 0) - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-white/5 mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span className="flex items-center gap-1" title="Total executions this agent has been part of">
            <Play className="w-3 h-3" /> {agent.executionCount || 0} runs
          </span>
          <span className="flex items-center gap-1" title="Average time this agent takes to respond">
            <ActivitySquare className="w-3 h-3" /> {agent.avgResponseTime ? agent.avgResponseTime.toFixed(1) + 's' : '-'} avg
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/agents/${agent.id}/chat`}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Open chat playground"
            >
              <MessageSquare className="w-3 h-3 mr-1" /> Chat
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => { if(confirm("Delete this agent? This will remove it from any workflows that use it.")) deleteAgent({ agentId: agent.id }) }}
            disabled={isDeleting}
            title="Delete agent"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateAgentForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate, isPending } = useCreateAgent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
        toast({ title: "Agent created successfully! You can now use it in workflows." });
        onSuccess();
      },
      onError: (err) => toast({ title: "Error creating agent", variant: "destructive" })
    }
  });

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    goal: "",
    provider: "openai" as const,
    model: "gpt-4o",
    temperature: 0.7,
    memoryEnabled: true
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [memoryType, setMemoryType] = useState("conversation");
  const [agentRole, setAgentRole] = useState("worker");
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(true);
  const [selectedTools, setSelectedTools] = useState<string[]>(["web_search"]);
  const [handoffEnabled, setHandoffEnabled] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const handleOptimizePrompt = async () => {
    if (!formData.role.trim()) {
      toast({ title: "Please write a prompt first", description: "Enter a system prompt to optimize.", variant: "destructive" });
      return;
    }
    setIsOptimizing(true);
    setOptimizedPrompt(null);
    setShowDiff(false);
    try {
      const resp = await fetch(`${import.meta.env.BASE_URL}api/agents/optimize-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPrompt: formData.role,
          agentName: formData.name || undefined,
          agentGoal: formData.goal || undefined,
          tools: selectedTools,
          provider: formData.provider,
          model: formData.model,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to optimize");
      }
      const data = await resp.json();
      setOptimizedPrompt(data.optimizedPrompt);
      setShowDiff(true);
      toast({ title: "Prompt optimized!", description: `Used ${data.tokensUsed} tokens.` });
    } catch (err: any) {
      toast({ title: "Optimization failed", description: err.message, variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const acceptOptimizedPrompt = () => {
    if (optimizedPrompt) {
      setFormData({ ...formData, role: optimizedPrompt });
      setOptimizedPrompt(null);
      setShowDiff(false);
      toast({ title: "Optimized prompt applied!" });
    }
  };

  const dismissOptimizedPrompt = () => {
    setOptimizedPrompt(null);
    setShowDiff(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: {
      ...formData,
      systemPrompt: `Role: ${agentRole}. Memory: ${memoryType}. Tools: ${selectedTools.join(', ')}. Guardrails: ${guardrailsEnabled ? 'enabled' : 'disabled'}. Handoffs: ${handoffEnabled ? 'enabled' : 'disabled'}.`,
    }});
  };

  const modelOptions: Record<string, { label: string; desc: string }[]> = {
    openai: [
      { label: "gpt-4o", desc: "Most capable - great for complex tasks" },
      { label: "gpt-4o-mini", desc: "Faster and cheaper - good for simple tasks" },
      { label: "gpt-4-turbo", desc: "Previous generation - still very capable" },
    ],
    anthropic: [
      { label: "claude-3-5-sonnet-20241022", desc: "Best balance of speed and intelligence" },
      { label: "claude-3-5-haiku-20241022", desc: "Very fast - best for high-volume tasks" },
      { label: "claude-3-opus-20240229", desc: "Most capable Claude model" },
    ],
    google: [
      { label: "gemini-1.5-pro", desc: "Most capable Gemini model" },
      { label: "gemini-1.5-flash", desc: "Fast and efficient" },
    ]
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          Agent Name
          <span className="text-red-400">*</span>
        </Label>
        <Input 
          required 
          placeholder="e.g. Data Analyst, Content Writer, Code Reviewer"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="bg-secondary/50 border-white/10"
        />
        <p className="text-[10px] text-muted-foreground">Give your agent a clear, descriptive name so you can easily identify it in workflows.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            AI Provider
            <span className="text-blue-400 cursor-help" title="The company providing the AI model. Each has different strengths."><HelpCircle className="w-3 h-3" /></span>
          </Label>
          <Select value={formData.provider} onValueChange={(v: any) => {
            const models = modelOptions[v];
            setFormData({...formData, provider: v, model: models?.[0]?.label || ''});
          }}>
            <SelectTrigger className="bg-secondary/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (GPT)</SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              <SelectItem value="google">Google (Gemini)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">The AI company whose models your agent will use.</p>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Model
            <span className="text-blue-400 cursor-help" title="The specific AI model. More capable models are slower and cost more."><HelpCircle className="w-3 h-3" /></span>
          </Label>
          <Select value={formData.model} onValueChange={v => setFormData({...formData, model: v})}>
            <SelectTrigger className="bg-secondary/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(modelOptions[formData.provider] || []).map(m => (
                <SelectItem key={m.label} value={m.label}>
                  <div>
                    <span>{m.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">- {m.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            Role / System Prompt
            <span className="text-red-400">*</span>
            <span className="text-blue-400 cursor-help" title="This tells the AI what kind of expert it should be. Be specific about its expertise and how it should respond."><HelpCircle className="w-3 h-3" /></span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOptimizePrompt}
            disabled={isOptimizing || !formData.role.trim()}
            className="h-7 text-xs gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
          >
            {isOptimizing ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Optimizing...</>
            ) : (
              <><Sparkles className="w-3 h-3" /> Optimize with AI</>
            )}
          </Button>
        </div>
        <Textarea 
          required
          rows={3}
          placeholder="You are an expert data analyst who specializes in extracting insights from CSV files and producing clear, actionable summaries with charts..."
          value={formData.role}
          onChange={e => setFormData({...formData, role: e.target.value})}
          className="bg-secondary/50 border-white/10 resize-none"
        />
        <p className="text-[10px] text-muted-foreground">This is the most important field. Tell the AI who it is, what it's an expert in, and how it should behave. The more specific you are, the better the results.</p>
        
        {showDiff && optimizedPrompt && (
          <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-purple-500/10 flex items-center justify-between bg-purple-500/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">AI-Optimized Prompt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  onClick={acceptOptimizedPrompt}
                  className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                >
                  <Check className="w-3 h-3" /> Accept
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={dismissOptimizedPrompt}
                  className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{optimizedPrompt}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          Goal
          <span className="text-blue-400 cursor-help" title="A short summary of what this agent is trying to accomplish."><HelpCircle className="w-3 h-3" /></span>
        </Label>
        <Input 
          placeholder="e.g. Analyze uploaded data files and provide insights"
          value={formData.goal}
          onChange={e => setFormData({...formData, goal: e.target.value})}
          className="bg-secondary/50 border-white/10"
        />
        <p className="text-[10px] text-muted-foreground">Optional. A one-line summary of what this agent should achieve.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-muted-foreground" />
              Temperature
            </Label>
            <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">{formData.temperature}</span>
          </div>
          <Slider 
            value={[formData.temperature]} 
            max={2} step={0.1}
            onValueChange={v => setFormData({...formData, temperature: v[0]})}
          />
          <p className="text-[10px] text-muted-foreground">
            Low (0.1) = precise and consistent. High (1.5+) = creative and varied. Default 0.7 works well for most tasks.
          </p>
        </div>
        <div className="flex flex-col justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Brain className="w-3 h-3 text-muted-foreground" />
                Vector Memory
              </Label>
              <p className="text-[10px] text-muted-foreground">Remember past conversations</p>
            </div>
            <Switch 
              checked={formData.memoryEnabled}
              onCheckedChange={v => setFormData({...formData, memoryEnabled: v})}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">When enabled, the agent remembers context from previous interactions.</p>
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Layers className="w-3.5 h-3.5" />
          {advancedOpen ? 'Hide' : 'Show'} Advanced Configuration
        </button>
      </div>

      {advancedOpen && (
        <div className="space-y-5 pt-2">
          <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Agent Role (CrewAI-style)
            </h3>
            <Select value={agentRole} onValueChange={setAgentRole}>
              <SelectTrigger className="bg-secondary/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">Worker — Executes tasks independently</SelectItem>
                <SelectItem value="researcher">Researcher — Gathers and analyzes information</SelectItem>
                <SelectItem value="writer">Writer — Creates and edits content</SelectItem>
                <SelectItem value="reviewer">Reviewer — Validates and quality-checks outputs</SelectItem>
                <SelectItem value="coordinator">Coordinator — Orchestrates other agents</SelectItem>
                <SelectItem value="analyst">Analyst — Data analysis and insights</SelectItem>
                <SelectItem value="custom">Custom Role</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Roles determine how this agent collaborates in multi-agent workflows. A coordinator can delegate tasks to workers and reviewers.</p>
          </div>

          <div className="p-4 rounded-xl border border-purple-500/10 bg-purple-500/5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Memory Configuration
            </h3>
            <Select value={memoryType} onValueChange={setMemoryType}>
              <SelectTrigger className="bg-secondary/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversation">Conversation Memory — Last N messages</SelectItem>
                <SelectItem value="summary">Summary Memory — Condensed conversation history</SelectItem>
                <SelectItem value="semantic">Semantic Memory — Vector-based recall by meaning</SelectItem>
                <SelectItem value="persistent">Persistent Memory — Cross-session long-term memory</SelectItem>
                <SelectItem value="none">No Memory</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                <div>
                  <p className="text-[10px] font-medium">Cross-Thread</p>
                  <p className="text-[8px] text-muted-foreground">Share memory across conversations</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                <div>
                  <p className="text-[10px] font-medium">Semantic Search</p>
                  <p className="text-[8px] text-muted-foreground">Find by meaning, not keywords</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Memory lets agents remember context. Conversation memory stores recent messages; semantic memory uses embeddings to recall relevant past interactions by meaning.</p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              Available Tools
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "web_search", label: "Web Search", desc: "Search the internet" },
                { id: "code_exec", label: "Code Execution", desc: "Run JS/Python code" },
                { id: "file_search", label: "File Search", desc: "Search uploaded documents" },
                { id: "api_call", label: "API Requests", desc: "Make HTTP requests" },
                { id: "sql_query", label: "SQL Query", desc: "Query databases" },
                { id: "calculator", label: "Calculator", desc: "Math operations" },
                { id: "knowledge_base", label: "Knowledge Base", desc: "RAG retrieval" },
                { id: "image_gen", label: "Image Generation", desc: "Create images" },
              ].map(tool => (
                <label key={tool.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                  selectedTools.includes(tool.id) ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/5 bg-secondary/30 hover:border-white/10'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTools.includes(tool.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedTools([...selectedTools, tool.id]);
                      else setSelectedTools(selectedTools.filter(t => t !== tool.id));
                    }}
                    className="sr-only"
                  />
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    selectedTools.includes(tool.id) ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                  }`}>
                    {selectedTools.includes(tool.id) && <span className="text-[8px] text-white">✓</span>}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium">{tool.label}</p>
                    <p className="text-[8px] text-muted-foreground">{tool.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Guardrails
              </h3>
              <Switch checked={guardrailsEnabled} onCheckedChange={setGuardrailsEnabled} />
            </div>
            {guardrailsEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <p className="text-[10px] font-medium">Input Validation</p>
                    <p className="text-[8px] text-muted-foreground">Block prompt injection</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <p className="text-[10px] font-medium">Output Moderation</p>
                    <p className="text-[8px] text-muted-foreground">Filter harmful content</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <p className="text-[10px] font-medium">PII Detection</p>
                    <p className="text-[8px] text-muted-foreground">Redact personal data</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <p className="text-[10px] font-medium">Token Limit</p>
                    <p className="text-[8px] text-muted-foreground">Cap response length</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                Agent Handoffs
              </h3>
              <Switch checked={handoffEnabled} onCheckedChange={setHandoffEnabled} />
            </div>
            <p className="text-[10px] text-muted-foreground">Allow this agent to transfer control to other agents mid-conversation. The receiving agent gets the full conversation context.</p>
          </div>
        </div>
      )}

      <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-primary text-white">
          {isPending ? "Creating..." : "Create Agent"}
        </Button>
      </div>
    </form>
  );
}
