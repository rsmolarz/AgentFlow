import { useState, useEffect } from "react";
import {
  Gauge, RefreshCw, AlertTriangle, CheckCircle2, Clock, TrendingUp, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface RateLimitInfo {
  provider: string;
  model: string;
  requestsPerMin: number;
  tokensPerMin: number;
  currentRPM: number;
  currentTPM: number;
  status: "healthy" | "warning" | "critical";
}

const defaultLimits: RateLimitInfo[] = [
  { provider: "OpenAI", model: "gpt-4o", requestsPerMin: 500, tokensPerMin: 30000, currentRPM: 0, currentTPM: 0, status: "healthy" },
  { provider: "OpenAI", model: "gpt-4o-mini", requestsPerMin: 5000, tokensPerMin: 200000, currentRPM: 0, currentTPM: 0, status: "healthy" },
  { provider: "Anthropic", model: "claude-3.5-sonnet", requestsPerMin: 50, tokensPerMin: 40000, currentRPM: 0, currentTPM: 0, status: "healthy" },
  { provider: "Anthropic", model: "claude-3-haiku", requestsPerMin: 50, tokensPerMin: 100000, currentRPM: 0, currentTPM: 0, status: "healthy" },
  { provider: "Google AI", model: "gemini-pro", requestsPerMin: 60, tokensPerMin: 32000, currentRPM: 0, currentTPM: 0, status: "healthy" },
  { provider: "Groq", model: "llama-3.1-70b", requestsPerMin: 30, tokensPerMin: 6000, currentRPM: 0, currentTPM: 0, status: "healthy" },
];

const statusConfig = {
  healthy: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Healthy" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Warning" },
  critical: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Critical" },
};

export default function RateLimits() {
  const [limits] = useState<RateLimitInfo[]>(defaultLimits);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            API Rate Limits
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor API usage against provider rate limits in real-time.
          </p>
        </div>
        <Button variant="outline" className="gap-2 border-border/50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" /> Providers Tracked
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {new Set(limits.map(l => l.provider)).size}
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gauge className="w-4 h-4" /> Models Monitored
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{limits.length}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" /> All Healthy
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {limits.filter(l => l.status === "healthy").length}/{limits.length}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {limits.map((limit, i) => {
          const cfg = statusConfig[limit.status];
          const StatusIcon = cfg.icon;
          const rpmPct = (limit.currentRPM / limit.requestsPerMin) * 100;
          const tpmPct = (limit.currentTPM / limit.tokensPerMin) * 100;
          return (
            <div key={i} className="bg-card border border-border/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{limit.provider}</h3>
                    <span className="text-xs text-muted-foreground">{limit.model}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`${cfg.color} border-current/20`}>{cfg.label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Requests/min</span>
                    <span>{limit.currentRPM}/{limit.requestsPerMin}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${rpmPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Tokens/min</span>
                    <span>{limit.currentTPM.toLocaleString()}/{limit.tokensPerMin.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${tpmPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
