import { useState, useMemo } from "react";
import { useListAgents } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Trophy, Medal, Crown, TrendingUp, TrendingDown, Clock, Zap,
  Target, DollarSign, Bot, ArrowUpDown, ChevronUp, ChevronDown,
  BarChart3, MessageSquare, Filter, Star, Flame, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortKey = "successRate" | "avgResponseTime" | "executionCount" | "costEfficiency";
type SortDir = "asc" | "desc";

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  openai: { label: "GPT", color: "bg-emerald-500/20 text-emerald-400" },
  anthropic: { label: "CLA", color: "bg-orange-500/20 text-orange-400" },
  google: { label: "GEM", color: "bg-blue-500/20 text-blue-400" },
};

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]" />;
  return <span className="text-sm font-mono text-muted-foreground w-5 text-center">{rank}</span>;
}

function getRankBg(rank: number) {
  if (rank === 1) return "border-yellow-500/20 bg-yellow-500/5";
  if (rank === 2) return "border-slate-300/15 bg-slate-300/5";
  if (rank === 3) return "border-amber-600/15 bg-amber-600/5";
  return "border-white/5 bg-transparent";
}

function getPerformanceBadge(rate: number) {
  if (rate >= 95) return { label: "Elite", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20", icon: Flame };
  if (rate >= 85) return { label: "Strong", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: TrendingUp };
  if (rate >= 70) return { label: "Average", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: Target };
  return { label: "Needs Work", color: "bg-red-500/15 text-red-400 border-red-500/20", icon: TrendingDown };
}

function getResponseTimeTier(time: number) {
  if (time <= 2) return "text-emerald-400";
  if (time <= 4) return "text-blue-400";
  if (time <= 6) return "text-yellow-400";
  return "text-red-400";
}

export default function Leaderboard() {
  const { data: agents, isLoading } = useListAgents({});
  const [sortKey, setSortKey] = useState<SortKey>("successRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    let filtered = [...agents];
    if (statusFilter !== "all") filtered = filtered.filter(a => a.status === statusFilter);
    if (providerFilter !== "all") filtered = filtered.filter(a => a.provider === providerFilter);
    return filtered;
  }, [agents, statusFilter, providerFilter]);

  const hasRuns = (a: any) => (a.executionCount ?? 0) > 0;
  const getEfficiency = (a: any) => {
    if (!hasRuns(a)) return -1;
    return (a.successRate ?? 0) / Math.max(a.avgResponseTime ?? 1, 0.1);
  };

  const sortedAgents = useMemo(() => {
    const list = [...filteredAgents];
    list.sort((a, b) => {
      let aVal: number, bVal: number;
      const aHasRuns = hasRuns(a);
      const bHasRuns = hasRuns(b);
      if (sortKey === "avgResponseTime" || sortKey === "costEfficiency") {
        if (!aHasRuns && !bHasRuns) return 0;
        if (!aHasRuns) return 1;
        if (!bHasRuns) return -1;
      }
      switch (sortKey) {
        case "successRate":
          aVal = a.successRate ?? 0;
          bVal = b.successRate ?? 0;
          break;
        case "avgResponseTime":
          aVal = a.avgResponseTime ?? 999;
          bVal = b.avgResponseTime ?? 999;
          break;
        case "executionCount":
          aVal = a.executionCount ?? 0;
          bVal = b.executionCount ?? 0;
          break;
        case "costEfficiency":
          aVal = getEfficiency(a);
          bVal = getEfficiency(b);
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return list;
  }, [filteredAgents, sortKey, sortDir]);

  const topAgents = useMemo(() => {
    if (filteredAgents.length === 0) return { fastest: null, mostUsed: null, bestRate: null };
    const withRuns = filteredAgents.filter(hasRuns);
    return {
      fastest: withRuns.length > 0 ? withRuns.reduce((best, a) => (a.avgResponseTime ?? 999) < (best.avgResponseTime ?? 999) ? a : best) : null,
      mostUsed: filteredAgents.reduce((best, a) => (a.executionCount ?? 0) > (best.executionCount ?? 0) ? a : best, filteredAgents[0]),
      bestRate: withRuns.length > 0 ? withRuns.reduce((best, a) => (a.successRate ?? 0) > (best.successRate ?? 0) ? a : best) : null,
    };
  }, [filteredAgents]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir(key === "avgResponseTime" ? "asc" : "desc");
    }
  };

  const SortHeader = ({ label, field, icon: Icon }: { label: string; field: SortKey; icon: any }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
        sortKey === field ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {sortKey === field ? (
        sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Performance Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Agents ranked by performance metrics. Compare success rates, response times, and overall efficiency.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] bg-secondary/50 border-border text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-secondary/50 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-12 bg-secondary/50 rounded-xl animate-pulse" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-secondary/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : agents?.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-3xl">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">No agents to rank</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Create some agents and run them in workflows to see their performance rankings here.
          </p>
          <Link href="/agents" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
            Go to Agents
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topAgents.bestRate && (
              <div className="glass-card rounded-2xl p-5 border border-yellow-500/15 bg-yellow-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-amber-500" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                    <Target className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Highest Success Rate</p>
                    <p className="font-semibold text-foreground">{topAgents.bestRate.name}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{(topAgents.bestRate.successRate ?? 0).toFixed(1)}%</p>
              </div>
            )}
            {topAgents.fastest && (
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/15 bg-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fastest Response</p>
                    <p className="font-semibold text-foreground">{topAgents.fastest.name}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{(topAgents.fastest.avgResponseTime ?? 0).toFixed(1)}s</p>
              </div>
            )}
            {topAgents.mostUsed && (
              <div className="glass-card rounded-2xl p-5 border border-blue-500/15 bg-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Most Used</p>
                    <p className="font-semibold text-foreground">{topAgents.mostUsed.name}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-400">{topAgents.mostUsed.executionCount ?? 0} runs</p>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-white/5 bg-secondary/30 grid grid-cols-12 items-center gap-4">
              <div className="col-span-1 text-xs font-medium text-muted-foreground text-center">Rank</div>
              <div className="col-span-4 text-xs font-medium text-muted-foreground">Agent</div>
              <div className="col-span-2 flex justify-center">
                <SortHeader label="Success Rate" field="successRate" icon={Target} />
              </div>
              <div className="col-span-2 flex justify-center">
                <SortHeader label="Avg Time" field="avgResponseTime" icon={Clock} />
              </div>
              <div className="col-span-1 flex justify-center">
                <SortHeader label="Runs" field="executionCount" icon={BarChart3} />
              </div>
              <div className="col-span-2 flex justify-center">
                <SortHeader label="Efficiency" field="costEfficiency" icon={Star} />
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {sortedAgents.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">No agents match the current filters.</p>
                  <Button variant="outline" size="sm" onClick={() => { setStatusFilter("all"); setProviderFilter("all"); }}>
                    Reset Filters
                  </Button>
                </div>
              )}
              {sortedAgents.map((agent, idx) => {
                const rank = idx + 1;
                const badge = getPerformanceBadge(agent.successRate ?? 0);
                const BadgeIcon = badge.icon;
                const provider = PROVIDER_LABELS[agent.provider] || { label: "AI", color: "bg-secondary text-muted-foreground" };
                const agentHasRuns = hasRuns(agent);
                const efficiency = agentHasRuns ? getEfficiency(agent) : null;

                return (
                  <div
                    key={agent.id}
                    className={`px-6 py-4 grid grid-cols-12 items-center gap-4 transition-colors hover:bg-white/[0.02] ${getRankBg(rank)}`}
                  >
                    <div className="col-span-1 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-white/5 flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground truncate">{agent.name}</p>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            agent.status === "active"
                              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                              : "bg-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${provider.color}`}>
                            {provider.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">{agent.model}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (agent.successRate ?? 0) >= 90
                                ? "bg-emerald-500"
                                : (agent.successRate ?? 0) >= 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(agent.successRate ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {(agent.successRate ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${badge.color} flex items-center gap-1`}>
                        <BadgeIcon className="w-2.5 h-2.5" />
                        {badge.label}
                      </span>
                    </div>

                    <div className="col-span-2 flex flex-col items-center">
                      {agentHasRuns ? (
                        <>
                          <span className={`text-sm font-semibold ${getResponseTimeTier(agent.avgResponseTime ?? 0)}`}>
                            {(agent.avgResponseTime ?? 0).toFixed(1)}s
                          </span>
                          <span className="text-[10px] text-muted-foreground">per response</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-sm font-semibold text-foreground">{agent.executionCount ?? 0}</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <div className="text-center">
                        <span className="text-sm font-semibold text-foreground">{efficiency !== null ? efficiency.toFixed(1) : "N/A"}</span>
                        {efficiency !== null && <p className="text-[10px] text-muted-foreground">score</p>}
                      </div>
                      <Link href={`/agents/${agent.id}/chat`} className="inline-flex items-center h-7 px-2 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-start gap-3">
            <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p><strong className="text-foreground">How rankings work:</strong> Agents are ranked by the selected metric. <strong>Success Rate</strong> measures task completion reliability. <strong>Avg Time</strong> shows response speed. <strong>Efficiency</strong> is calculated as success rate divided by response time — higher means the agent delivers reliable results quickly.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
