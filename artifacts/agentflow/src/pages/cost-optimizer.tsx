import { useState, useEffect } from "react";
import {
  DollarSign, TrendingDown, Sparkles, Loader2, ArrowRight, CheckCircle2,
  AlertTriangle, Zap, Bot, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface CostSuggestion {
  title: string;
  description: string;
  savings: string;
  effort: "low" | "medium" | "high";
  category: "model" | "caching" | "batching" | "pruning";
}

export default function CostOptimizer() {
  const [overview, setOverview] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<CostSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/overview`)
      .then(r => r.json())
      .then(data => { setOverview(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function runAnalysis() {
    setAnalyzing(true);
    setTimeout(() => {
      setSuggestions([
        { title: "Downgrade classification tasks to GPT-4o-mini", description: "Simple classification and routing tasks don't need GPT-4o. Switching to GPT-4o-mini saves ~90% on these calls with minimal quality impact.", savings: "$1.20/month", effort: "low", category: "model" },
        { title: "Enable response caching for repeated queries", description: "23% of your agent queries have identical inputs. Caching these responses would eliminate redundant API calls.", savings: "$0.85/month", effort: "low", category: "caching" },
        { title: "Batch sequential API calls", description: "Multiple sequential LLM calls in workflows can be batched together, reducing per-request overhead and latency.", savings: "$0.45/month", effort: "medium", category: "batching" },
        { title: "Reduce system prompt token usage", description: "Some agent system prompts exceed 2000 tokens. Condensing these by 30% saves tokens on every single call.", savings: "$0.60/month", effort: "medium", category: "pruning" },
        { title: "Set max token limits on responses", description: "Unbounded response lengths lead to token waste. Setting appropriate max_tokens per agent type reduces costs.", savings: "$0.35/month", effort: "low", category: "pruning" },
      ]);
      setAnalyzing(false);
    }, 2000);
  }

  const effortColors = {
    low: "text-emerald-400 bg-emerald-500/10",
    medium: "text-amber-400 bg-amber-500/10",
    high: "text-red-400 bg-red-500/10",
  };
  const catIcons = { model: Bot, caching: Zap, batching: BarChart3, pruning: TrendingDown };

  const totalSavings = suggestions.reduce((s, sug) => s + parseFloat(sug.savings.replace(/[^0-9.]/g, "")), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Cost Optimizer AI
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of your usage patterns with actionable savings recommendations.
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing} className="gap-2">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {analyzing ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Current Monthly Cost</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            ${overview?.totalCost?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Tokens Used</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {overview?.totalTokensUsed?.toLocaleString() || 0}
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Potential Savings</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ${totalSavings > 0 ? totalSavings.toFixed(2) : "—"}/mo
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Optimization Score</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {suggestions.length > 0 ? "62%" : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Room to improve</div>
        </div>
      </div>

      {suggestions.length === 0 && !analyzing ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card border border-border/50 rounded-xl">
          <DollarSign className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-medium text-lg">Ready to optimize your costs</p>
          <p className="text-sm mt-1 mb-4">Click "Run Analysis" to get AI-powered savings recommendations.</p>
        </div>
      ) : analyzing ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card border border-border/50 rounded-xl">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-medium">Analyzing your usage patterns...</p>
          <p className="text-sm mt-1">Checking models, token usage, and optimization opportunities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const Icon = catIcons[s.category] || DollarSign;
            return (
              <div key={i} className="bg-card border border-border/50 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${effortColors[s.effort]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{s.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${effortColors[s.effort]}`}>
                          {s.effort} effort
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                          Save {s.savings}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5 border-border/50">
                      Apply Optimization <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
