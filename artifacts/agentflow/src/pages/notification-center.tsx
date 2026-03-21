import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Bell, CheckCheck, Trash2, RefreshCw, AlertCircle, CheckCircle2,
  Info, AlertTriangle, XCircle, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown>;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Info; color: string }> = {
  success: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
  error: { icon: XCircle, color: "text-red-400 bg-red-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-400 bg-amber-500/10" },
  info: { icon: Info, color: "text-blue-400 bg-blue-500/10" },
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications`);
      setNotifications(await res.json());
    } catch { }
    setLoading(false);
  }

  useEffect(() => { fetchNotifications(); }, []);

  async function markRead(id: number) {
    await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: "PUT" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await fetch(`${API_BASE}/api/notifications/read-all`, { method: "PUT" });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function deleteNotification(id: number) {
    await fetch(`${API_BASE}/api/notifications/${id}`, { method: "DELETE" });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const filtered = filter === "unread" ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Notification Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated on agent executions, system events, and alerts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={markAllRead} variant="outline" size="sm" className="gap-2 border-border/50"
            disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
          <Button onClick={fetchNotifications} variant="outline" size="sm" className="gap-2 border-border/50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm"
          onClick={() => setFilter("all")} className="border-border/50">
          All ({notifications.length})
        </Button>
        <Button variant={filter === "unread" ? "default" : "outline"} size="sm"
          onClick={() => setFilter("unread")} className="border-border/50">
          Unread ({unreadCount})
        </Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl">
            <Bell className="w-10 h-10 mb-3 opacity-50" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          filtered.map(n => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div key={n.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer
                  ${n.read
                    ? "bg-card border-border/30 opacity-70"
                    : "bg-card border-border/50 hover:border-primary/30"}`}
                onClick={() => !n.read && markRead(n.id)}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{n.title}</span>
                    {!n.read && <Badge className="bg-primary/20 text-primary text-xs">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {format(new Date(n.createdAt), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                  className="opacity-50 hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
