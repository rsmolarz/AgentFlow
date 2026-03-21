import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Bot, Search, Plus, Sparkles, Headphones, Code2, FileText,
  BarChart3, Microscope, Mail, Database, Scale, Clipboard, Plug, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Preset {
  id: number;
  name: string;
  role: string;
  description: string;
  icon: string;
  category: string;
  systemPrompt: string | null;
  model: string;
  tools: unknown[];
  builtin: boolean;
}

const categoryColors: Record<string, string> = {
  support: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  engineering: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  content: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  analytics: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  research: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  communication: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  compliance: "text-red-400 bg-red-500/10 border-red-500/20",
  productivity: "text-green-400 bg-green-500/10 border-green-500/20",
  general: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

export default function AgentPresets() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const { toast } = useToast();

  async function fetchPresets() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent-presets`);
      setPresets(await res.json());
    } catch { }
    setLoading(false);
  }

  useEffect(() => { fetchPresets(); }, []);

  async function applyPreset(preset: Preset) {
    setApplying(preset.id);
    try {
      const res = await fetch(`${API_BASE}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: preset.name,
          description: preset.description,
          model: preset.model,
          systemPrompt: preset.systemPrompt || "",
          status: "active",
          provider: "openai",
        }),
      });
      if (res.ok) {
        toast({ title: "Agent created from preset", description: `${preset.name} agent is ready.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create agent.", variant: "destructive" });
    }
    setApplying(null);
  }

  const categories = ["all", ...new Set(presets.map(p => p.category))];
  const filtered = presets.filter(p =>
    (selectedCategory === "all" || p.category === selectedCategory) &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Agent Role Presets
          </h1>
          <p className="text-muted-foreground mt-1">
            Pre-configured agent templates with optimized prompts and settings. One click to deploy.
          </p>
        </div>
        <Badge variant="outline" className="text-sm border-border/50">
          {presets.length} Presets
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search presets..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card border-border/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <Button key={c} variant={selectedCategory === c ? "default" : "outline"} size="sm"
              onClick={() => setSelectedCategory(c)} className="capitalize border-border/50">
              {c}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading presets...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(preset => {
            const colorClass = categoryColors[preset.category] || categoryColors.general;
            return (
              <div key={preset.id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{preset.name}</h3>
                      <Badge variant="outline" className={`text-xs mt-1 ${colorClass}`}>
                        {preset.category}
                      </Badge>
                    </div>
                  </div>
                  {preset.builtin && <Badge className="bg-primary/20 text-primary text-xs">Built-in</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{preset.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Model: {preset.model}</span>
                  <Button size="sm" onClick={() => applyPreset(preset)} disabled={applying === preset.id}
                    className="gap-1.5">
                    {applying === preset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Deploy Agent
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
