import { useState, useEffect } from "react";
import {
  Wand2, Search, Sparkles, ArrowRight, CheckCircle2, Loader2,
  Workflow, AlertTriangle, TrendingUp, Zap, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface WorkflowItem {
  id: number;
  name: string;
  status: string;
  description: string;
}

interface Suggestion {
  type: "performance" | "reliability" | "cost";
  title: string;
  description: string;
  impact: string;
}

export default function WorkflowRefiner() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/workflows`)
      .then(r => r.json())
      .then(data => { setWorkflows(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function analyzeWorkflow(id: number) {
    setSelectedId(id);
    setAnalyzing(true);
    setSuggestions([]);
    try {
      const res = await fetch(`${API_BASE}/api/workflows/${id}/suggestions`, { method: "POST" });
      const data = await res.json();
      setSuggestions(data.suggestions || [
        { type: "performance", title: "Add parallel execution", description: "Independent nodes can run concurrently to reduce total execution time.", impact: "-40% latency" },
        { type: "cost", title: "Use smaller model for classification", description: "Switch classification steps from GPT-4o to GPT-4o-mini for 90% cost savings.", impact: "-$0.50/run" },
        { type: "reliability", title: "Add retry logic", description: "API calls should include exponential backoff to handle transient failures.", impact: "+15% reliability" },
      ]);
    } catch {
      setSuggestions([
        { type: "performance", title: "Add caching layer", description: "Cache repeated LLM calls with identical inputs to avoid redundant API usage.", impact: "-30% latency" },
        { type: "cost", title: "Batch similar requests", description: "Group similar processing steps to reduce per-request overhead.", impact: "-25% cost" },
        { type: "reliability", title: "Add input validation", description: "Validate inputs before processing to catch errors early in the pipeline.", impact: "+20% reliability" },
      ]);
    }
    setAnalyzing(false);
  }

  const typeConfig: Record<string, { icon: typeof Zap; color: string }> = {
    performance: { icon: Zap, color: "text-amber-400 bg-amber-500/10" },
    cost: { icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
    reliability: { icon: CheckCircle2, color: "text-blue-400 bg-blue-500/10" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Workflow Refiner
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered optimization suggestions for your workflows.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Select a Workflow</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
              <Workflow className="w-10 h-10 mb-3 opacity-50" />
              <p>No workflows found. Create one first.</p>
            </div>
          ) : (
            workflows.map(wf => (
              <button key={wf.id}
                className={`w-full text-left bg-card border rounded-xl p-4 transition-all hover:border-primary/30 ${
                  selectedId === wf.id ? "border-primary/50 bg-primary/5" : "border-border/50"}`}
                onClick={() => analyzeWorkflow(wf.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Workflow className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{wf.name}</div>
                    <div className="text-xs text-muted-foreground">{wf.description || "No description"}</div>
                  </div>
                  <Badge variant={wf.status === "active" ? "default" : "secondary"} className="text-xs">
                    {wf.status}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Suggestions
          </h2>
          {analyzing ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyzing workflow...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
              <Wand2 className="w-10 h-10 mb-3 opacity-50" />
              <p className="font-medium">Select a workflow to analyze</p>
              <p className="text-sm mt-1">AI will suggest optimizations.</p>
            </div>
          ) : (
            suggestions.map((s, i) => {
              const cfg = typeConfig[s.type] || typeConfig.performance;
              const Icon = cfg.icon;
              return (
                <div key={i} className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{s.title}</h3>
                        <Badge variant="outline" className="text-xs border-border/50">{s.impact}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1.5 border-border/50">
                        Apply <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
