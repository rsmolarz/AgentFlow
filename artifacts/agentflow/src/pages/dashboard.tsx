import { useState, useEffect, useMemo } from "react";
import { useGetAnalyticsOverview, useGetExecutionStats, useListExecutions, useListAgents, useListWorkflows, useGetCostByProvider } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Bot, Workflow, ActivitySquare, CheckCircle, XCircle, Clock, Zap, TrendingUp, TrendingDown, ArrowRight, 
  BarChart3, DollarSign, Rocket, BookOpen, Lightbulb, ChevronRight, X, Sparkles, Shield,
  Database, HelpCircle, CalendarRange, Flame
} from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line
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
  const { data: costByProvider } = useGetCostByProvider();
  const { data: costForecast } = useQuery({
    queryKey: ["/api/analytics/cost-forecast"],
    queryFn: async () => {
      const resp = await fetch(`${import.meta.env.BASE_URL}api/analytics/cost-forecast`);
      if (!resp.ok) throw new Error("Failed to fetch cost forecast");
      return resp.json() as Promise<{
        history: { date: string; cost: number; executions: number; tokens: number }[];
        forecast: { date: string; cost: number }[];
        summary: { dailyAverage: number; trend: number; projected30d: number; historical30d: number; trendDirection: string };
      }>;
    },
  });

  const forecastChartData = useMemo(() => {
    if (!costForecast) return [];
    const historyData = costForecast.history.map((d) => ({
      date: d.date,
      actual: d.cost,
      forecast: null as number | null,
    }));
    const lastActual = historyData.length > 0 ? historyData[historyData.length - 1].actual : 0;
    const bridgePoint = historyData.length > 0
      ? { date: historyData[historyData.length - 1].date, actual: lastActual, forecast: lastActual }
      : null;
    const forecastData = costForecast.forecast.map((d) => ({
      date: d.date,
      actual: null as number | null,
      forecast: d.cost,
    }));
    if (bridgePoint && forecastData.length > 0) {
      historyData[historyData.length - 1] = bridgePoint;
    }
    return [...historyData, ...forecastData];
  }, [costForecast]);

  const hasForecastData = costForecast?.history?.some((d) => d.cost > 0) ?? false;

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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-primary" />
            30-Day Cost Forecast
          </h2>
          {costForecast?.summary && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Daily Avg</p>
                <p className="text-sm font-semibold text-foreground">${costForecast.summary.dailyAverage.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Projected 30d</p>
                <p className="text-sm font-semibold text-foreground">${costForecast.summary.projected30d.toFixed(2)}</p>
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                costForecast.summary.trendDirection === "increasing"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : costForecast.summary.trendDirection === "decreasing"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}>
                {costForecast.summary.trendDirection === "increasing" ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : costForecast.summary.trendDirection === "decreasing" ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                {costForecast.summary.trendDirection === "increasing" ? "Costs Rising" :
                 costForecast.summary.trendDirection === "decreasing" ? "Costs Falling" : "Stable"}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">Historical daily costs and projected spend based on usage trends. Solid line = actual, dashed line = forecast.</p>
        <div className="h-64">
          {hasForecastData && forecastChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastChartData}>
                <defs>
                  <linearGradient id="actualCostGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(val) => {
                    try { return format(new Date(val), "MMM d"); } catch { return val; }
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: any, name: string) => [
                    value !== null ? `$${Number(value).toFixed(2)}` : null,
                    name === "actual" ? "Actual Cost" : "Forecasted Cost",
                  ]}
                  labelFormatter={(label) => {
                    try { return format(new Date(label), "MMM d, yyyy"); } catch { return label; }
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  fill="url(#actualCostGradient)"
                  strokeWidth={2}
                  name="actual"
                  connectNulls={false}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  name="forecast"
                  connectNulls={false}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <CalendarRange className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No cost data yet</p>
              <p className="text-xs mt-1">Run workflows to see cost forecasting appear here</p>
            </div>
          )}
        </div>
        {costForecast?.summary && costForecast.summary.historical30d > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last 30 Days</p>
              <p className="text-lg font-bold text-foreground">${costForecast.summary.historical30d.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next 30 Days (est)</p>
              <p className="text-lg font-bold text-amber-400">${costForecast.summary.projected30d.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Daily Trend</p>
              <p className={`text-lg font-bold ${
                costForecast.summary.trend > 0 ? "text-red-400" : costForecast.summary.trend < 0 ? "text-emerald-400" : "text-blue-400"
              }`}>
                {costForecast.summary.trend > 0 ? "+" : ""}{costForecast.summary.trend.toFixed(2)}/day
              </p>
            </div>
          </div>
        )}
      </div>

      <TokenUsageHeatmap />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Cost Breakdown by Provider
          </h2>
          <div className="space-y-3">
            {costByProvider && costByProvider.length > 0 ? (
              costByProvider.map((p, i) => {
                const colors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-red-500"];
                return (
                  <div key={p.provider} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.provider} <span className="text-muted-foreground font-normal text-xs">({p.model})</span></span>
                      <span className="text-xs text-muted-foreground">${p.cost.toFixed(2)} &middot; {(p.tokens / 1000).toFixed(0)}k tokens</span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2">
                      <div className={`${colors[i % colors.length]} rounded-full h-2 transition-all`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No cost data yet</p>
                <p className="text-xs mt-1">Run workflows to see cost breakdown by provider</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Platform Status
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "API Server", status: "healthy" },
              { name: "PostgreSQL", status: "healthy" },
              { name: "OpenAI", status: "healthy" },
              { name: "Anthropic", status: "healthy" },
              { name: "Google AI", status: "healthy" },
              { name: "Vector Store", status: "healthy" },
              { name: "Queue System", status: "healthy" },
              { name: "MCP Server", status: "healthy" },
            ].map(s => (
              <div key={s.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                <div className={`w-2 h-2 rounded-full ${s.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                <span className="text-sm text-muted-foreground">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || "";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function TokenUsageHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/analytics/token-heatmap"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/analytics/token-heatmap`);
      if (!res.ok) throw new Error("Failed to fetch heatmap");
      return res.json() as Promise<{ heatmap: { day: number; hour: number; tokens: number }[] }>;
    },
  });

  const maxTokens = data ? Math.max(...data.heatmap.map(d => d.tokens), 1) : 1;

  const cellColor = (tokens: number) => {
    if (tokens === 0) return "bg-secondary/30";
    const intensity = tokens / maxTokens;
    if (intensity < 0.2) return "bg-emerald-500/20";
    if (intensity < 0.4) return "bg-emerald-500/40";
    if (intensity < 0.6) return "bg-emerald-500/60";
    if (intensity < 0.8) return "bg-amber-500/60";
    return "bg-red-500/60";
  };

  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    if (i % 3 !== 0) return "";
    return i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i - 12}p`;
  });

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-400" />
        Token Usage Heatmap
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Token consumption by day and hour over the last 30 days</p>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex">
            <div className="w-10 shrink-0" />
            <div className="flex-1 flex">
              {hourLabels.map((label, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground/60">
                  {label}
                </div>
              ))}
            </div>
          </div>

          {DAY_LABELS.map((dayLabel, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-1">
              <div className="w-10 text-[10px] text-muted-foreground text-right pr-1 shrink-0">
                {dayLabel}
              </div>
              <div className="flex-1 flex gap-[2px]">
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = data?.heatmap.find(c => c.day === dayIdx && c.hour === hour);
                  const tokens = cell?.tokens || 0;
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-6 rounded-sm ${cellColor(tokens)} transition-colors cursor-default`}
                      title={`${dayLabel} ${hour}:00 — ${tokens.toLocaleString()} tokens`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-[9px] text-muted-foreground">Less</span>
            <div className="flex gap-[2px]">
              <div className="w-3 h-3 rounded-sm bg-secondary/30" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
              <div className="w-3 h-3 rounded-sm bg-amber-500/60" />
              <div className="w-3 h-3 rounded-sm bg-red-500/60" />
            </div>
            <span className="text-[9px] text-muted-foreground">More</span>
          </div>
        </div>
      )}
    </div>
  );
}
