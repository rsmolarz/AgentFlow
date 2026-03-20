import { useState } from "react";
import {
  useListFeatureRequests,
  useCreateFeatureRequest,
  useVoteFeatureRequest,
  useDeleteFeatureRequest,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Lightbulb,
  Plus,
  Search,
  ChevronUp,
  Trash2,
  X,
  Info,
  ArrowUpDown,
  Download,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  high: { label: "High", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  low: { label: "Low", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  in_progress: { label: "In Progress", icon: Loader2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const CATEGORIES = [
  "general",
  "workflow",
  "agents",
  "integrations",
  "analytics",
  "knowledge_base",
  "ui_ux",
  "performance",
  "security",
  "doctor_pipeline",
];

function CreateFeatureRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<string>("medium");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useCreateFeatureRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/feature-requests"] });
        setTitle("");
        setDescription("");
        setCategory("general");
        setPriority("medium");
        onClose();
      },
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            New Feature Request
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Title</label>
            <Input
              placeholder="Brief description of the feature..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Detailed explanation of what you need and why..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category</label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Priority</label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutate({ data: { title, description, category, priority: priority as any } })}
            disabled={!title.trim() || isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FeatureRequests() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const params: any = {};
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;
  if (sortBy !== "newest") params.sort = sortBy;

  const { data: featureRequests, isLoading } = useListFeatureRequests(
    Object.keys(params).length > 0 ? params : undefined
  );

  const { mutate: vote } = useVoteFeatureRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/feature-requests"] });
      },
    },
  });

  const { mutate: deleteRequest } = useDeleteFeatureRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/feature-requests"] });
      },
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/feature-requests/export/json");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feature-requests-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const totalVotes = featureRequests?.reduce((sum, fr) => sum + (fr.votes || 0), 0) || 0;
  const pendingCount = featureRequests?.filter((fr) => fr.status === "pending").length || 0;
  const inProgressCount = featureRequests?.filter((fr) => fr.status === "in_progress").length || 0;
  const completedCount = featureRequests?.filter((fr) => fr.status === "completed").length || 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Feature Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Track, vote, and manage feature requests for the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      <div className="bg-card/50 border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Submit feature requests to suggest new functionality. Vote on requests you want to see prioritized. Export all requests as JSON via the <code className="text-xs bg-primary/10 px-1.5 py-0.5 rounded text-primary">/api/feature-requests/export/json</code> endpoint.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{featureRequests?.length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Requests</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{inProgressCount}</p>
          <p className="text-xs text-muted-foreground mt-1">In Progress</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search feature requests..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="votes">Most Voted</option>
          <option value="priority">Highest Priority</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !featureRequests?.length ? (
        <div className="text-center py-20">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-1">No feature requests yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Be the first to suggest a new feature for the platform.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Submit a Request
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {featureRequests.map((fr) => {
            const priorityConfig = PRIORITY_CONFIG[fr.priority] || PRIORITY_CONFIG.medium;
            const statusConfig = STATUS_CONFIG[fr.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={fr.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group"
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => vote({ id: fr.id })}
                      className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center hover:bg-primary/10 hover:border-primary/40 transition-all"
                    >
                      <ChevronUp className="w-5 h-5 text-primary" />
                    </button>
                    <span className="text-sm font-bold text-foreground">{fr.votes || 0}</span>
                    <span className="text-[10px] text-muted-foreground">votes</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{fr.title}</h3>
                        {fr.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {fr.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Delete this feature request?")) {
                            deleteRequest({ id: fr.id });
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${priorityConfig.bg} ${priorityConfig.color}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {priorityConfig.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-border bg-secondary/30 text-muted-foreground">
                        <Tag className="w-3 h-3" />
                        {fr.category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(fr.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateFeatureRequestDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
