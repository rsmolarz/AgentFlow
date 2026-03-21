import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Brain, Search, RefreshCw, Bot, Clock, Database, Trash2, ChevronDown, ChevronRight, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Agent {
  id: number;
  name: string;
  model: string;
  status: string;
}

interface MemoryEntry {
  role: string;
  content: string;
  timestamp: string;
}

export default function MemoryViewer() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/agents`)
      .then(r => r.json())
      .then(data => { setAgents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = agents.filter(a =>
    search === "" || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const memoryStats = agents.reduce((acc, a) => {
    acc.totalAgents++;
    if (a.status === "active") acc.activeAgents++;
    return acc;
  }, { totalAgents: 0, activeAgents: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Memory Viewer
          </h1>
          <p className="text-muted-foreground mt-1">
            Inspect agent conversation history, context windows, and memory utilization.
          </p>
        </div>
        <Button variant="outline" className="gap-2 border-border/50" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Agents</div>
          <div className="text-2xl font-bold text-foreground mt-1">{memoryStats.totalAgents}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Active Agents</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{memoryStats.activeAgents}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Memory Type</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">Contextual</div>
          <div className="text-xs text-muted-foreground">Session-based memory</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card border-border/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading agents...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
          <Brain className="w-10 h-10 mb-3 opacity-50" />
          <p className="font-medium">No agents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(agent => (
            <div key={agent.id} className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{agent.name}</span>
                    <Badge variant={agent.status === "active" ? "default" : "secondary"} className="text-xs">
                      {agent.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Model: {agent.model}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="text-right text-xs">
                    <div>Context Window</div>
                    <div className="font-medium text-foreground">128K tokens</div>
                  </div>
                  {expandedAgent === agent.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>
              {expandedAgent === agent.id && (
                <div className="border-t border-border/30 p-4 bg-muted/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-3 rounded-lg bg-card border border-border/30">
                      <div className="text-xs text-muted-foreground">Messages</div>
                      <div className="text-lg font-bold text-foreground">0</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-card border border-border/30">
                      <div className="text-xs text-muted-foreground">Tokens Used</div>
                      <div className="text-lg font-bold text-foreground">0</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-card border border-border/30">
                      <div className="text-xs text-muted-foreground">Memory Usage</div>
                      <div className="text-lg font-bold text-emerald-400">0%</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-card border border-border/30">
                      <div className="text-xs text-muted-foreground">Sessions</div>
                      <div className="text-lg font-bold text-blue-400">0</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    No conversation history yet. Start a chat with this agent to see memory data.
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
