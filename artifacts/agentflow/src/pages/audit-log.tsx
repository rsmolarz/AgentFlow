import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Shield, Search, Filter, RefreshCw, User, Bot, Workflow,
  Settings, Trash2, Edit2, Plus, Eye, Download, Clock, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

const actionIcons: Record<string, typeof Plus> = {
  create: Plus, update: Edit2, delete: Trash2, view: Eye, export: Download, login: User
};
const actionColors: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-500/10",
  update: "text-blue-400 bg-blue-500/10",
  delete: "text-red-400 bg-red-500/10",
  view: "text-gray-400 bg-gray-500/10",
  export: "text-amber-400 bg-amber-500/10",
  login: "text-violet-400 bg-violet-500/10",
};
const entityIcons: Record<string, typeof Bot> = {
  agent: Bot, workflow: Workflow, settings: Settings, integration: Filter
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  async function fetchLogs() {
    setLoading(true);
    try {
      const url = filterType !== "all"
        ? `${API_BASE}/api/audit-logs?entityType=${filterType}`
        : `${API_BASE}/api/audit-logs`;
      const [logsRes, statsRes] = await Promise.all([
        fetch(url).then(r => r.json()),
        fetch(`${API_BASE}/api/audit-logs/stats`).then(r => r.json()),
      ]);
      setLogs(logsRes);
      setStats(statsRes);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { fetchLogs(); }, [filterType]);

  const filtered = logs.filter(l =>
    search === "" ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entityType.toLowerCase().includes(search.toLowerCase()) ||
    l.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">Track all changes, access events, and system activity.</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="gap-2 border-border/50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Events</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats.total.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Today's Events</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.today}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Entity Types</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {new Set(logs.map(l => l.entityType)).size}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card border-border/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "agent", "workflow", "integration", "settings"].map(t => (
            <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm"
              onClick={() => setFilterType(t)} className="capitalize border-border/50">
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading events...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Shield className="w-10 h-10 mb-3 opacity-50" />
            <p className="font-medium">No audit events yet</p>
            <p className="text-sm mt-1">Actions will appear here as you use the platform.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(log => {
              const ActionIcon = actionIcons[log.action] || AlertTriangle;
              const EntityIcon = entityIcons[log.entityType] || Shield;
              const colorClass = actionColors[log.action] || "text-gray-400 bg-gray-500/10";
              return (
                <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground capitalize">{log.action}</span>
                      <Badge variant="outline" className="text-xs gap-1 border-border/50">
                        <EntityIcon className="w-3 h-3" />
                        {log.entityType}
                      </Badge>
                      {log.entityId && (
                        <span className="text-xs text-muted-foreground">#{log.entityId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{log.userName}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
