import { useState, useEffect } from "react";
import { useGetAnalyticsOverview, useGetExecutionStats, useListExecutions, useListAgents, useListWorkflows } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Bot, Workflow, ActivitySquare, CheckCircle, XCircle, Clock, Zap, TrendingUp, TrendingDown, ArrowRight, 
  BarChart3, DollarSign, Rocket, BookOpen, Lightbulb, ChevronRight, X, Sparkles, Shield,
  Database, HelpCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";

function StatCard({ 
  title, value, subtitle, icon: Icon, trend, trendLabel, color = "primary", tooltip
}: { 
  title: string; value: string | number; subtitle?: string; icon: any; trend?: number; trendLabel?: string; color?: string; tooltip?: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 border-primary/20",
    green: "from-green-500/20 to-green-500/5 border-green-500/20",
    red: "from-red-500/20 to-red-500/5 border-red-500/20",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
  };
  const iconColorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    green: "text-green-400 bg-green-500/10",
    red: "text-red-400 bg-red-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorMap[color]} p-5 transition-all hover:scale-[1.02]`} title={tooltip}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={trend >= 0 ? "text-green-400" : "text-red-400"}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
          {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {status === "completed" && <CheckCircle className="w-3 h-3" />}
      {status === "running" && <Zap className="w-3 h-3 animate-pulse" />}
      {status === "failed" && <XCircle className="w-3 h-3" />}
      {status === "pending" && <Clock className="w-3 h-3" />}
      {status}
    </span>
  );
}

function OnboardingChecklist({ agentCount, workflowCount, executionCount }: { agentCount: number; workflowCount: number; executionCount: number }) {
  const [dismissed, setDismissed] = useState(false);
  const [stored, setStored] = useState<boolean | null>(null);

  useEffect(() => {
    const v = localStorage.getItem('agentflow-onboarding-dismissed');
    setStored(v === 'true');
  }, []);

  if (stored === null) return null;
  if (stored || dismissed) return null;

  const steps = [
    { 
      done: agentCount > 0, 
      label: "Create your first AI Agent",
      desc: "An agent is an AI worker with specific skills. Go to Agents and click 'New Agent' to set up one with a name, role, and AI provider.",
      link: "/agents",
      icon: Bot
    },
    { 
      done: workflowCount > 0, 
      label: "Build a workflow pipeline",
      desc: "A workflow connects multiple steps into an automated pipeline. Go to Workflows, create one, then use the visual Builder to add and connect nodes.",
      link: "/workflows",
      icon: Workflow
    },
    { 
      done: executionCount > 0, 
      label: "Run your first workflow",
      desc: "Open a workflow in the Builder and click the green 'Run' button. Then check the Executions page to see the results.",
      link: "/executions",
      icon: Rocket
    },
  ];

  const completedCount = steps.filter(s => s.done).length;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent p-6 relative">
      <button 
        onClick={() => { setDismissed(true); localStorage.setItem('agentflow-onboarding-dismissed', 'true'); }}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold">Welcome to AgentFlow</h2>
          <p className="text-sm text-muted-foreground">Complete these steps to get started ({completedCount}/{steps.length})</p>
        </div>
      </div>

      <div className="w-full bg-secondary/50 rounded-full h-2 mb-5">
        <div className="bg-primary rounded-full h-2 transition-all duration-500" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <Link key={i} href={step.link}>
              <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                step.done ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-secondary/30 border border-white/5 hover:border-primary/20'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  step.done ? 'bg-emerald-500/20' : 'bg-secondary'
                }`}>
                  {step.done ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <StepIcon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? 'text-emerald-400 line-through' : ''}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: overview } = useGetAnalyticsOverview({ period: "week" });
  const { data: stats } = useGetExecutionStats({ period: "week" });
  const { data: executions } = useListExecutions({ limit: 8 });
  const { data: agents } = useListAgents();
  const { data: workflows } = useListWorkflows();

  const successRate = overview && overview.totalExecutions > 0
    ? ((overview.successfulExecutions / overview.totalExecutions) * 100).toFixed(1)
    : "0";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your AI agent platform. Monitor agents, workflows, and execution performance.</p>
      </div>

      <OnboardingChecklist 
        agentCount={agents?.length || 0}
        workflowCount={workflows?.length || 0}
        executionCount={overview?.totalExecutions || 0}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={overview?.totalAgents ?? 0}
          subtitle={`${overview?.activeAgents ?? 0} active`}
          icon={Bot}
          color="blue"
          tooltip="AI agents are autonomous workers that can process data, answer questions, and complete tasks. Each agent has a specific role and AI model."
        />
        <StatCard
          title="Workflows"
          value={overview?.totalWorkflows ?? 0}
          subtitle={`${overview?.activeWorkflows ?? 0} active`}
          icon={Workflow}
          color="purple"
          tooltip="Workflows are automated pipelines that connect multiple agents and steps together. They define the order of operations."
        />
        <StatCard
          title="Executions"
          value={overview?.totalExecutions ?? 0}
          trend={overview?.executionTrend}
          trendLabel="vs last period"
          icon={ActivitySquare}
          color="primary"
          tooltip="Every time a workflow runs, it counts as one execution. This shows how many times your workflows have been triggered."
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          trend={overview?.successRateTrend}
          trendLabel="vs last period"
          icon={CheckCircle}
          color="green"
          tooltip="The percentage of workflow executions that completed successfully without errors."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Avg Response Time"
          value={overview?.avgExecutionTime ? `${overview.avgExecutionTime.toFixed(1)}s` : "0s"}
          icon={Clock}
          color="amber"
          tooltip="How long it takes, on average, for a workflow to complete from start to finish."
        />
        <StatCard
          title="Tokens Used"
          value={overview?.totalTokensUsed ? overview.totalTokensUsed.toLocaleString() : "0"}
          icon={Zap}
          color="primary"
          tooltip="Tokens are the units AI models use to measure text. More complex tasks use more tokens. This shows total usage across all executions."
        />
        <StatCard
          title="Estimated Cost"
          value={overview?.totalCost ? `$${overview.totalCost.toFixed(2)}` : "$0.00"}
          icon={DollarSign}
          color="green"
          tooltip="Estimated cost based on tokens used and the pricing of each AI model."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Execution Trends
            </h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <div className="h-64">
            {stats && stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                  <defs>
                    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(val) => {
                      try { return format(new Date(val), "MMM d"); } catch { return val; }
                    }}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))"
                    }} 
                  />
                  <Area type="monotone" dataKey="successful" stroke="hsl(var(--primary))" fill="url(#successGradient)" strokeWidth={2} name="Successful" />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#failGradient)" strokeWidth={2} name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No execution data yet</p>
                <p className="text-xs mt-1">Run a workflow to see trends appear here</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ActivitySquare className="w-5 h-5 text-primary" />
              Recent Executions
            </h2>
            <Link href="/executions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {executions?.items && executions.items.length > 0 ? (
              executions.items.slice(0, 6).map((exec) => (
                <div key={exec.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exec.workflowName || `Workflow #${exec.workflowId}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {exec.createdAt ? format(new Date(exec.createdAt), "MMM d, HH:mm") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {exec.duration !== undefined && exec.duration !== null && (
                      <span className="text-xs text-muted-foreground">{exec.duration.toFixed(1)}s</span>
                    )}
                    <StatusBadge status={exec.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No executions yet</p>
                <p className="text-xs mt-1">Go to Workflows, build a pipeline, and click Run</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Quick Actions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Jump to any section of the platform:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/agents" className="block">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-blue-500/50 transition-all group cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Manage Agents</span>
              </div>
              <p className="text-xs text-muted-foreground">Create, configure, and test your AI agents. Each agent has its own role, tools, and AI model.</p>
            </div>
          </Link>
          <Link href="/workflows" className="block">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-purple-500/50 transition-all group cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Workflow className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Build Workflows</span>
              </div>
              <p className="text-xs text-muted-foreground">Design automated pipelines with the visual drag-and-drop builder. Connect agents and logic nodes.</p>
            </div>
          </Link>
          <Link href="/knowledge-bases" className="block">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-teal-500/50 transition-all group cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-teal-400" />
                <span className="font-medium">Knowledge Bases</span>
              </div>
              <p className="text-xs text-muted-foreground">Upload documents and data so your agents can search and reference them (RAG).</p>
            </div>
          </Link>
          <Link href="/templates" className="block">
            <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-amber-500/50 transition-all group cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="font-medium">Browse Templates</span>
              </div>
              <p className="text-xs text-muted-foreground">Start fast with pre-built agent and workflow templates. One click to apply.</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Platform Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-sm text-muted-foreground">API Server</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-sm text-muted-foreground">Database</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-sm text-muted-foreground">AI Providers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-sm text-muted-foreground">Queue System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
