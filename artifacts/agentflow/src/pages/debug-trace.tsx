import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Bug, Search, RefreshCw, Bot, Clock, ChevronDown, ChevronRight,
  Play, AlertCircle, CheckCircle2, ArrowRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Execution {
  id: number;
  workflowId: number;
  workflowName: string;
  status: string;
  duration: number;
  tokensUsed: number;
  createdAt: string;
}

export default function DebugTrace() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/executions`)
      .then(r => r.json())
      .then(data => { setExecutions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = executions.filter(e =>
    search === "" || e.workflowName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            Debug Trace
          </h1>
          <p className="text-muted-foreground mt-1">
            Step-through execution traces for agent debugging and troubleshooting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Executions</div>
          <div className="text-2xl font-bold text-foreground mt-1">{executions.length}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {executions.filter(e => e.status === "failed").length}
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Avg Duration</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {executions.length > 0 ? (executions.reduce((s, e) => s + (e.duration || 0), 0) / executions.length).toFixed(1) : 0}s
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search executions..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card border-border/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading traces...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
          <Bug className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">No execution traces</p>
          <p className="text-sm mt-1">Run a workflow to generate debug traces.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exec => (
            <div key={exec.id} className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  exec.status === "completed" ? "bg-emerald-500/10" :
                  exec.status === "failed" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                  {exec.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   exec.status === "failed" ? <AlertCircle className="w-4 h-4 text-red-400" /> :
                   <Clock className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{exec.workflowName || `Execution #${exec.id}`}</span>
                    <Badge variant={exec.status === "completed" ? "default" : "destructive"} className="text-xs">
                      {exec.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span><Clock className="w-3 h-3 inline mr-1" />{exec.duration?.toFixed(1)}s</span>
                    <span>{exec.tokensUsed?.toLocaleString()} tokens</span>
                    <span>{format(new Date(exec.createdAt), "MMM d, HH:mm")}</span>
                  </div>
                </div>
                {expandedId === exec.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> :
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {expandedId === exec.id && (
                <div className="border-t border-border/30 p-4 bg-muted/10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span className="text-muted-foreground">Workflow started</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground">{exec.workflowName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bot className="w-4 h-4 text-blue-400" />
                      <span className="text-muted-foreground">Agent processing</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground">{exec.tokensUsed?.toLocaleString()} tokens consumed</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {exec.status === "completed" ?
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                        <AlertCircle className="w-4 h-4 text-red-400" />}
                      <span className="text-muted-foreground">Execution {exec.status}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground">{exec.duration?.toFixed(1)}s total</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
