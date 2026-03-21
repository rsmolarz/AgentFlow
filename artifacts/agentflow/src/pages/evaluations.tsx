import { useState } from "react";
import { useListAgents, useListEvalRuns, useCreateEvalRun } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FlaskConical, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle,
  Play, Clock, BarChart3, Target, ArrowRight, RefreshCw, Filter, Plus,
  Zap, Brain, FileText, Gauge, Shield, Eye, ChevronRight, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const METRIC_THRESHOLDS = [
  { label: "Accuracy", key: "accuracy" as const, icon: Target, desc: "How correct are the agent's outputs vs expected answers" },
  { label: "Relevance", key: "relevance" as const, icon: Eye, desc: "How relevant are responses to the original query" },
  { label: "Coherence", key: "coherence" as const, icon: Brain, desc: "How logically consistent and well-structured are outputs" },
  { label: "Safety", key: "safety" as const, icon: Shield, desc: "Does the agent avoid harmful, biased, or inappropriate content" },
];

function ScoreRing({ score, size = 56, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "text-emerald-400" : score >= 75 ? "text-amber-400" : "text-red-400";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className={`stroke-current ${color}`} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${color}`}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function Evaluations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: agents } = useListAgents();
  const { data: evalRuns, isLoading } = useListEvalRuns();
  const createEvalRun = useCreateEvalRun();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const runs = evalRuns || [];
  const filteredRuns = runs.filter(r => statusFilter === "all" || r.status === statusFilter);

  const avgScore = runs.length > 0 ? runs.reduce((sum, r) => sum + r.score, 0) / runs.length : 0;
  const totalTests = runs.reduce((sum, r) => sum + r.totalTests, 0);
  const passRate = totalTests > 0 ? runs.reduce((sum, r) => sum + r.passedTests, 0) / totalTests * 100 : 0;
  const totalCost = runs.reduce((sum, r) => sum + r.cost, 0);

  const handleRunEval = () => {
    const agentList = agents || [];
    const randomAgent = agentList.length > 0 ? agentList[Math.floor(Math.random() * agentList.length)] : null;
    createEvalRun.mutate(
      { data: { name: `Evaluation Run ${new Date().toLocaleDateString()}`, agentName: randomAgent?.name || "Default Agent", agentId: randomAgent?.id } },
      {
        onSuccess: (newRun) => {
          queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
          toast({ title: `Evaluation complete! ${newRun.passedTests}/${newRun.totalTests} tests passed (${newRun.score.toFixed(1)}%).` });
        },
        onError: () => { toast({ title: "Failed to run evaluation", variant: "destructive" }); },
      }
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient">Evaluations</h1>
          <p className="text-muted-foreground mt-1">Test agents, monitor quality drift, and iterate on prompts with data-driven insights.</p>
        </div>
        <Button onClick={handleRunEval} disabled={createEvalRun.isPending} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
          {createEvalRun.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</> : <><Play className="w-4 h-4 mr-2" /> Run Evaluation</>}
        </Button>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p><strong className="text-foreground">What are Evaluations?</strong> Evaluations let you test your agents against datasets, catch quality regressions when you change prompts or models, and monitor drift over time. Similar to LangSmith's evaluation suite — define test cases, run them against your agents, and compare results across iterations.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card/60 p-4 animate-pulse">
              <div className="h-3 bg-secondary rounded w-20 mb-2" />
              <div className="h-6 bg-secondary rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Quality Score</p>
              <p className="text-2xl font-bold text-emerald-400">{avgScore.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">Across {runs.length} eval runs</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Tests Run</p>
              <p className="text-2xl font-bold">{totalTests}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Across {runs.length} eval runs</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs text-muted-foreground mb-1">Pass Rate</p>
              <p className="text-2xl font-bold text-blue-400">{passRate.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{runs.filter(r => r.status === 'passed').length} passed runs</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs text-muted-foreground mb-1">Eval Cost</p>
              <p className="text-2xl font-bold text-amber-400">${totalCost.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{runs.reduce((s, r) => s + r.tokenUsage, 0).toLocaleString()} tokens used</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {METRIC_THRESHOLDS.map(metric => {
              const avg = runs.length > 0 ? runs.reduce((sum, r) => sum + (r.metrics?.[metric.key] || 0), 0) / runs.length : 0;
              return (
                <div key={metric.key} className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3">
                  <ScoreRing score={avg} />
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <metric.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      {metric.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{metric.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Evaluation Runs
        </h2>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-white/10 h-9 text-sm">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredRuns.map(run => (
          <div
            key={run.id}
            onClick={() => setSelectedRunId(selectedRunId === run.id ? null : run.id)}
            className={`rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/30 ${
              selectedRunId === run.id ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-secondary/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <ScoreRing score={run.score} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{run.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    run.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    run.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    run.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {run.status === 'passed' && <CheckCircle className="w-2.5 h-2.5" />}
                    {run.status === 'warning' && <AlertTriangle className="w-2.5 h-2.5" />}
                    {run.status === 'failed' && <XCircle className="w-2.5 h-2.5" />}
                    {run.status === 'running' && <Zap className="w-2.5 h-2.5 animate-pulse" />}
                    {run.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agent: {run.agentName} &middot; {run.passedTests}/{run.totalTests} tests passed &middot; {new Date(run.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1" title="Average latency"><Clock className="w-3 h-3" /> {run.avgLatency}s</span>
                <span className="flex items-center gap-1" title="Tokens used"><Zap className="w-3 h-3" /> {(run.tokenUsage / 1000).toFixed(0)}k</span>
                <span className="flex items-center gap-1" title="Cost"><span>$</span>{run.cost.toFixed(2)}</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selectedRunId === run.id ? 'rotate-90' : ''}`} />
            </div>

            {selectedRunId === run.id && run.metrics && (
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {METRIC_THRESHOLDS.map(metric => (
                  <div key={metric.key} className="flex items-center gap-2">
                    <ScoreRing score={run.metrics[metric.key]} size={36} strokeWidth={3} />
                    <div>
                      <p className="text-[10px] font-medium">{metric.label}</p>
                      <p className="text-[10px] text-muted-foreground">{run.metrics[metric.key]}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!isLoading && filteredRuns.length === 0 && (
        <div className="text-center py-16">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-1">No evaluation runs found</h3>
          <p className="text-sm text-muted-foreground">Run your first evaluation to start tracking agent quality.</p>
        </div>
      )}
    </div>
  );
}
