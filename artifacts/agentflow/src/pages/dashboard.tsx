import { useGetAnalyticsOverview, useGetExecutionStats, useListExecutions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Bot, Workflow, ActivitySquare, CheckCircle, XCircle, Clock, Zap, TrendingUp, TrendingDown, ArrowRight, 
  BarChart3, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

function StatCard({ 
  title, value, subtitle, icon: Icon, trend, trendLabel, color = "primary" 
}: { 
  title: string; value: string | number; subtitle?: string; icon: any; trend?: number; trendLabel?: string; color?: string;
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
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${colorMap[color]} p-5 transition-all hover:scale-[1.02]`}>
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

export default function Dashboard() {
  const { data: overview } = useGetAnalyticsOverview({ period: "week" });
  const { data: stats } = useGetExecutionStats({ period: "week" });
  const { data: executions } = useListExecutions({ limit: 8 });

  const successRate = overview && overview.totalExecutions > 0
    ? ((overview.successfulExecutions / overview.totalExecutions) * 100).toFixed(1)
    : "0";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your AI agent platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={overview?.totalAgents ?? 0}
          subtitle={`${overview?.activeAgents ?? 0} active`}
          icon={Bot}
          color="blue"
        />
        <StatCard
          title="Workflows"
          value={overview?.totalWorkflows ?? 0}
          subtitle={`${overview?.activeWorkflows ?? 0} active`}
          icon={Workflow}
          color="purple"
        />
        <StatCard
          title="Executions"
          value={overview?.totalExecutions ?? 0}
          trend={overview?.executionTrend}
          trendLabel="vs last period"
          icon={ActivitySquare}
          color="primary"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          trend={overview?.successRateTrend}
          trendLabel="vs last period"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Avg Response Time"
          value={overview?.avgExecutionTime ? `${overview.avgExecutionTime.toFixed(1)}s` : "0s"}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Tokens Used"
          value={overview?.totalTokensUsed ? overview.totalTokensUsed.toLocaleString() : "0"}
          icon={Zap}
          color="primary"
        />
        <StatCard
          title="Estimated Cost"
          value={overview?.totalCost ? `$${overview.totalCost.toFixed(2)}` : "$0.00"}
          icon={DollarSign}
          color="green"
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
                  <Area type="monotone" dataKey="successful" stroke="hsl(var(--primary))" fill="url(#successGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#failGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No execution data yet. Run a workflow to see trends.</p>
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
                <p>No executions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/agents" className="block">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-primary/50 transition-all group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-blue-400" />
                <span className="font-medium">Manage Agents</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Link>
        <Link href="/workflows" className="block">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-primary/50 transition-all group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Workflow className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Build Workflows</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Link>
        <Link href="/templates" className="block">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-primary/50 transition-all group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="font-medium">Browse Templates</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
