import { useState } from "react";
import { 
  useListAgents, 
  useCreateAgent, 
  useDeleteAgent,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, MoreVertical, Search, Trash2, Edit2, Play, BrainCircuit, ActivitySquare, Code2, PenTool, BarChart2, Headphones, Mail } from "lucide-react";
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
          <p className="text-muted-foreground mt-1">Manage your autonomous AI workers.</p>
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
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-white/10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Create AI Agent</DialogTitle>
              </DialogHeader>
              <CreateAgentForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
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
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Create your first AI agent to start building automated workflows.</p>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white">Create Agent</Button>
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
      case 'openai': return <span className="font-bold text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">GPT</span>;
      case 'anthropic': return <span className="font-bold text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">CLA</span>;
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
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`} />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-sm text-foreground/80 line-clamp-2 mb-4">{agent.role}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
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

      <div className="pt-4 border-t border-white/5 mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span className="flex items-center gap-1" title="Executions">
            <Play className="w-3 h-3" /> {agent.executionCount || 0}
          </span>
          <span className="flex items-center gap-1" title="Avg Response">
            <ActivitySquare className="w-3 h-3" /> {agent.avgResponseTime ? agent.avgResponseTime.toFixed(1) + 's' : '-'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { if(confirm("Delete agent?")) deleteAgent({ agentId: agent.id }) }}
            disabled={isDeleting}
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
        toast({ title: "Agent created successfully" });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input 
            required 
            placeholder="e.g. Data Analyst"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="bg-secondary/50 border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={formData.provider} onValueChange={(v: any) => setFormData({...formData, provider: v})}>
            <SelectTrigger className="bg-secondary/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Role (System Prompt)</Label>
        <Textarea 
          required
          rows={3}
          placeholder="You are an expert data analyst..."
          value={formData.role}
          onChange={e => setFormData({...formData, role: e.target.value})}
          className="bg-secondary/50 border-white/10 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Goal</Label>
        <Input 
          placeholder="Analyze CSVs and provide summaries"
          value={formData.goal}
          onChange={e => setFormData({...formData, goal: e.target.value})}
          className="bg-secondary/50 border-white/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Temperature</Label>
            <span className="text-xs text-muted-foreground">{formData.temperature}</span>
          </div>
          <Slider 
            value={[formData.temperature]} 
            max={2} step={0.1}
            onValueChange={v => setFormData({...formData, temperature: v[0]})}
          />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
          <div className="space-y-0.5">
            <Label className="text-sm">Vector Memory</Label>
            <p className="text-xs text-muted-foreground">Remember past conversations</p>
          </div>
          <Switch 
            checked={formData.memoryEnabled}
            onCheckedChange={v => setFormData({...formData, memoryEnabled: v})}
          />
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-primary text-white">
          {isPending ? "Creating..." : "Create Agent"}
        </Button>
      </div>
    </form>
  );
}
