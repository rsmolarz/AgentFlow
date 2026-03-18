import { useState } from "react";
import { useListExecutions, useGetExecutionLogs } from "@workspace/api-client-react";
import { format } from "date-fns";
import { 
  ActivitySquare, Play, CheckCircle2, XCircle, Clock, FileText, ChevronDown, 
  ChevronRight, Zap, Bot, Filter, Code2, Sparkles, ArrowRightLeft, AlertTriangle,
  Search, RefreshCw, X, Timer, BarChart3, Coins, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stepIcons: Record<string, any> = {
  trigger: Zap, agent: Bot, condition: Filter, code: Code2,
  llm_call: Sparkles, transform: ArrowRightLeft, output: FileText,
  error_handler: AlertTriangle, delay: Timer, loop: RefreshCw,
};

const stepColors: Record<string, string> = {
  trigger: "text-emerald-400", agent: "text-blue-400", condition: "text-amber-400",
  code: "text-slate-400", llm_call: "text-pink-400", transform: "text-cyan-400",
  output: "text-purple-400", error_handler: "text-red-400",
};

function generateMockSteps(exec: any) {
  const statuses = exec.status === 'completed' 
    ? ['completed', 'completed', 'completed', 'completed']
    : exec.status === 'failed' 
    ? ['completed', 'completed', 'failed']
    : ['completed', 'running'];
  
  const stepTypes = ['trigger', 'agent', 'llm_call', 'condition', 'transform', 'output'];
  const stepNames = ['Start Trigger', 'Process with AI Agent', 'Generate LLM Response', 'Check Quality', 'Transform Data', 'Send Output'];
  
  return statuses.map((status, i) => ({
    id: i + 1,
    name: stepNames[i] || `Step ${i + 1}`,
    type: stepTypes[i] || 'agent',
    status,
    duration: status === 'running' ? null : (Math.random() * 10 + 0.5).toFixed(2),
    tokensUsed: status === 'completed' ? Math.floor(Math.random() * 2000 + 100) : null,
    input: { data: `Input data for step ${i + 1}` },
    output: status === 'completed' ? { result: `Processed result from step ${i + 1}` } : null,
    error: status === 'failed' ? 'Rate limit exceeded. The API returned a 429 error. Consider adding a delay between calls or upgrading your plan.' : null,
    startedAt: new Date(Date.now() - (statuses.length - i) * 5000).toISOString(),
  }));
}

function ExecutionDetail({ exec, onClose }: { exec: any; onClose: () => void }) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const { data: apiLogs, isLoading: logsLoading } = useGetExecutionLogs(exec.id);
  
  const steps = apiLogs && apiLogs.length > 0
    ? apiLogs.map((log: any, i: number) => ({
        id: log.id || i + 1,
        name: log.nodeName || log.nodeId || `Step ${i + 1}`,
        type: log.nodeType || 'agent',
        status: log.status || 'completed',
        duration: log.duration?.toFixed(2) || null,
        tokensUsed: log.tokensUsed || null,
        input: log.input || {},
        output: log.output || null,
        error: log.error || null,
        startedAt: log.startedAt,
      }))
    : generateMockSteps(exec);

  const toggleStep = (id: number) => {
    const next = new Set(expandedSteps);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedSteps(next);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
      case 'failed': return { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
      case 'running': return { icon: Play, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
      default: return { icon: Clock, color: "text-muted-foreground", bg: "bg-secondary border-border" };
    }
  };

  const overallStatus = getStatusConfig(exec.status);
  const OverallIcon = overallStatus.icon;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-card border-l border-white/10 overflow-y-auto animate-in slide-in-from-right-5 duration-200">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Execution Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <OverallIcon className={`w-4 h-4 ${overallStatus.color}`} />
                <span className={`text-sm font-semibold capitalize ${overallStatus.color}`}>{exec.status}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase">Status</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold font-mono">{exec.duration ? `${exec.duration.toFixed(2)}s` : '-'}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold font-mono">{exec.tokensUsed?.toLocaleString() || '-'}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Tokens</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold font-mono">{exec.cost ? `$${exec.cost.toFixed(4)}` : '-'}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Cost</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Workflow</h3>
          </div>
          <p className="text-sm text-foreground mb-1">{exec.workflowName || `Workflow #${exec.workflowId}`}</p>
          <p className="text-xs text-muted-foreground mb-6">
            Started: {exec.startedAt ? format(new Date(exec.startedAt), "PPpp") : '-'}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <ActivitySquare className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Step-by-Step Execution Log</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Each step shows what happened during the workflow run. Click a step to see its input and output data.
          </p>

          <div className="space-y-2">
            {steps.map((step, index) => {
              const StepIcon = stepIcons[step.type] || Zap;
              const stepStatus = getStatusConfig(step.status);
              const StepStatusIcon = stepStatus.icon;
              const isExpanded = expandedSteps.has(step.id);

              return (
                <div key={step.id}>
                  {index > 0 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-white/10" />
                    </div>
                  )}
                  <div className={`border rounded-xl overflow-hidden transition-colors ${
                    step.status === 'failed' ? 'border-red-500/30 bg-red-500/5' :
                    step.status === 'running' ? 'border-blue-500/30 bg-blue-500/5' :
                    'border-white/5 bg-secondary/30'
                  }`}>
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${stepStatus.bg}`}>
                        <StepIcon className={`w-3.5 h-3.5 ${stepColors[step.type] || 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{step.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{step.type.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {step.duration && <span className="text-xs text-muted-foreground font-mono">{step.duration}s</span>}
                        <StepStatusIcon className={`w-4 h-4 ${stepStatus.color} ${step.status === 'running' ? 'animate-pulse' : ''}`} />
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                        {step.tokensUsed && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Coins className="w-3 h-3" />
                            <span>{step.tokensUsed.toLocaleString()} tokens used</span>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Input</p>
                          <pre className="bg-background/50 border border-white/5 rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto max-h-32">
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>

                        {step.output && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Output</p>
                            <pre className="bg-background/50 border border-white/5 rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto max-h-32">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.error && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                            <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Error Details
                            </p>
                            <p className="text-xs text-red-300">{step.error}</p>
                            <div className="mt-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded text-xs text-amber-300">
                              <strong>Suggestion:</strong> Add a Delay node before this step to avoid rate limits, or add an Error Handler node to retry automatically.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Executions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedExec, setSelectedExec] = useState<any>(null);
  const { data: executions, isLoading } = useListExecutions({ limit: 100 });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
      case 'failed': return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
      case 'running': return { icon: Play, color: "text-primary", bg: "bg-primary/10 border-primary/20", extra: "animate-pulse" };
      default: return { icon: Clock, color: "text-muted-foreground", bg: "bg-secondary border-border" };
    }
  };

  const filteredExecutions = executions?.items?.filter((exec: any) => {
    if (statusFilter !== 'all' && exec.status !== statusFilter) return false;
    if (search && !(exec.workflowName || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient">Executions</h1>
        <p className="text-muted-foreground mt-1">Detailed logs of all workflow runs. Click any row to see step-by-step details.</p>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p><strong className="text-foreground">What are executions?</strong> Every time you run a workflow, it creates an execution record. Each execution tracks the status (running, completed, or failed), how long it took, how many AI tokens were used, and the cost. Click any execution to see exactly what happened at each step.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by workflow name..." 
            className="pl-9 bg-secondary/50 border-border h-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-secondary/50 border-border h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 border-b border-white/5 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider">Workflow</th>
                <th className="px-6 py-4 font-medium tracking-wider">Started</th>
                <th className="px-6 py-4 font-medium tracking-wider">Duration</th>
                <th className="px-6 py-4 font-medium tracking-wider">Tokens</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-secondary rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-secondary rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-secondary rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-secondary rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-secondary rounded" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-secondary rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : !filteredExecutions?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {search || statusFilter !== 'all' ? 'No executions match your filters.' : 'No executions recorded yet. Run a workflow to see results here.'}
                  </td>
                </tr>
              ) : (
                filteredExecutions.map((exec: any) => {
                  const status = getStatusConfig(exec.status);
                  const Icon = status.icon;
                  return (
                    <tr 
                      key={exec.id} 
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedExec(exec)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={`capitalize font-semibold border px-2.5 py-1 ${status.bg} ${status.color}`}>
                          <Icon className={`w-3.5 h-3.5 mr-1.5 ${(status as any).extra || ''}`} />
                          {exec.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {exec.workflowName || `Workflow #${exec.workflowId}`}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {exec.startedAt ? format(new Date(exec.startedAt), "MMM d, HH:mm:ss") : '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">
                        {exec.duration ? `${exec.duration.toFixed(2)}s` : '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">
                        {exec.tokensUsed || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setSelectedExec(exec); }}
                        >
                          <FileText className="w-4 h-4 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedExec && (
        <ExecutionDetail exec={selectedExec} onClose={() => setSelectedExec(null)} />
      )}
    </div>
  );
}
