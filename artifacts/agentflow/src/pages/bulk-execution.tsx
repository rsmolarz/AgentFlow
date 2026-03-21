import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useListWorkflows } from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  Upload, Play, CheckCircle2, XCircle, Clock, FileSpreadsheet,
  Loader2, AlertTriangle, ArrowRight, Trash2, BarChart3, Download,
  Table2, ChevronDown, ChevronRight, RefreshCw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

interface BulkResult {
  row: number;
  status: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  duration?: number;
}

interface BulkExecution {
  id: number;
  workflowId: number;
  workflowName: string;
  status: string;
  totalRows: number;
  completedRows: number;
  failedRows: number;
  headers: string[];
  results: BulkResult[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
  createdAt: string;
}

function CSVUploader({ onUpload }: { onUpload: (headers: string[], rows: Record<string, any>[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, any> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return row;
    }).filter(r => Object.values(r).some(v => v !== ""));
    onUpload(headers, rows);
  }, [onUpload]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => parseCSV(e.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragOver ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 hover:bg-secondary/20"
      }`}
    >
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm font-medium">Drop your CSV file here or click to browse</p>
      <p className="text-xs text-muted-foreground mt-1">First row should be headers. Max 500 rows.</p>
    </div>
  );
}

function ProgressBar({ completed, failed, total }: { completed: number; failed: number; total: number }) {
  const successPct = total > 0 ? (completed / total) * 100 : 0;
  const failPct = total > 0 ? (failed / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{completed + failed} / {total} rows processed</span>
        <span>{Math.round(successPct + failPct)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
        <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${successPct}%` }} />
        <div className="bg-red-500 transition-all duration-300" style={{ width: `${failPct}%` }} />
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className="text-emerald-400">{completed} succeeded</span>
        {failed > 0 && <span className="text-red-400">{failed} failed</span>}
      </div>
    </div>
  );
}

function BulkRunDetail({ exec }: { exec: BulkExecution }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = exec.results?.filter(r =>
    filter === "all" || r.status === filter
  ) || [];

  const exportCSV = () => {
    if (!exec.results?.length) return;
    const allKeys = new Set<string>();
    exec.results.forEach(r => {
      Object.keys(r.input || {}).forEach(k => allKeys.add(`input.${k}`));
      Object.keys(r.output || {}).forEach(k => allKeys.add(`output.${k}`));
    });
    const headers = ["row", "status", "duration", ...allKeys, "error"];
    const lines = [headers.join(",")];
    exec.results.forEach(r => {
      const vals = [
        r.row, r.status, r.duration?.toFixed(2) || "",
        ...[...allKeys].map(k => {
          const [prefix, field] = k.split(".");
          const obj = prefix === "input" ? r.input : r.output;
          return `"${String(obj?.[field] || "").replace(/"/g, '""')}"`;
        }),
        `"${(r.error || "").replace(/"/g, '""')}"`
      ];
      lines.push(vals.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-results-${exec.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <ProgressBar completed={exec.completedRows || 0} failed={exec.failedRows || 0} total={exec.totalRows || 0} />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            className={`text-xs px-2 py-1 rounded ${filter === "all" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFilter("all")}
          >All ({exec.results?.length || 0})</button>
          <button
            className={`text-xs px-2 py-1 rounded ${filter === "completed" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFilter("completed")}
          >Passed</button>
          <button
            className={`text-xs px-2 py-1 rounded ${filter === "failed" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFilter("failed")}
          >Failed</button>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={exportCSV}>
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {filtered.map((r) => (
          <div key={r.row} className="rounded-lg border border-white/5 bg-secondary/20 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === r.row ? null : r.row)}
              className="w-full flex items-center justify-between p-2.5 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {r.status === "completed" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-xs font-medium">Row {r.row}</span>
                <span className="text-[10px] text-muted-foreground">
                  {Object.entries(r.input || {}).slice(0, 2).map(([k, v]) => `${k}: ${String(v).substring(0, 20)}`).join(", ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.duration && <span className="text-[10px] text-muted-foreground">{r.duration.toFixed(1)}s</span>}
                {expanded === r.row ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            </button>
            {expanded === r.row && (
              <div className="px-3 pb-3 space-y-2 border-t border-white/5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2 mb-1">Input</p>
                  <pre className="text-xs bg-secondary/50 rounded p-2 overflow-auto text-muted-foreground">{JSON.stringify(r.input, null, 2)}</pre>
                </div>
                {r.output && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Output</p>
                    <pre className="text-xs bg-secondary/50 rounded p-2 overflow-auto text-emerald-400">{JSON.stringify(r.output, null, 2)}</pre>
                  </div>
                )}
                {r.error && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Error</p>
                    <pre className="text-xs bg-red-500/10 rounded p-2 overflow-auto text-red-400">{r.error}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BulkExecution() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: workflows } = useListWorkflows();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [running, setRunning] = useState(false);
  const [activeExecId, setActiveExecId] = useState<number | null>(null);

  const { data: bulkExecs, isLoading: listLoading } = useQuery<BulkExecution[]>({
    queryKey: ["/api/bulk-executions"],
    queryFn: () => fetch(`${BASE}api/bulk-executions`).then(r => r.json()),
    refetchInterval: activeExecId ? 2000 : false,
  });

  const { data: activeExec } = useQuery<BulkExecution>({
    queryKey: [`/api/bulk-executions/${activeExecId}`],
    queryFn: () => fetch(`${BASE}api/bulk-executions/${activeExecId}`).then(r => r.json()),
    enabled: !!activeExecId,
    refetchInterval: (data) => {
      const d = data?.state?.data;
      return d && d.status === "running" ? 1000 : false;
    },
  });

  useEffect(() => {
    if (activeExec?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-executions"] });
    }
  }, [activeExec?.status]);

  const handleUpload = (h: string[], r: Record<string, any>[]) => {
    setHeaders(h);
    setRows(r);
    toast({ title: `Loaded ${r.length} rows`, description: `Columns: ${h.join(", ")}` });
  };

  const handleRun = async () => {
    if (!selectedWorkflow || rows.length === 0) {
      toast({ title: "Select a workflow and upload CSV first", variant: "destructive" });
      return;
    }
    setRunning(true);
    try {
      const r = await fetch(`${BASE}api/workflows/${selectedWorkflow}/bulk-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, headers }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed to start");
      const exec = await r.json();
      setActiveExecId(exec.id);
      setRows([]);
      setHeaders([]);
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-executions"] });
      toast({ title: "Bulk execution started!", description: `Processing ${exec.totalRows} rows` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bulk execution?")) return;
    await fetch(`${BASE}api/bulk-executions/${id}`, { method: "DELETE" });
    if (activeExecId === id) setActiveExecId(null);
    queryClient.invalidateQueries({ queryKey: ["/api/bulk-executions"] });
    toast({ title: "Deleted" });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient">Bulk Execution</h1>
        <p className="text-muted-foreground mt-1">Run a workflow on multiple CSV rows at once with real-time progress tracking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">New Bulk Run</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Select Workflow</label>
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue placeholder="Choose a workflow..." /></SelectTrigger>
              <SelectContent>
                {workflows?.map((w: any) => (
                  <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <CSVUploader onUpload={handleUpload} />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">{rows.length} rows loaded</span>
                  <span className="text-xs text-muted-foreground">({headers.length} columns)</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setRows([]); setHeaders([]); }}>
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>

              <div className="overflow-auto max-h-[200px] rounded-lg border border-white/5">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">#</th>
                      {headers.map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                        {headers.map((h) => (
                          <td key={h} className="px-2 py-1.5 truncate max-w-[150px]">{String(row[h] || "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground text-center bg-secondary/30 border-t border-white/5">
                    ... and {rows.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleRun}
            disabled={!selectedWorkflow || rows.length === 0 || running}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0"
          >
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {running ? "Starting..." : `Run on ${rows.length} rows`}
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">
                {activeExec ? `Run #${activeExec.id} — ${activeExec.workflowName}` : "Results"}
              </h2>
            </div>
            {activeExec && activeExec.status === "running" && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
              </span>
            )}
            {activeExec && activeExec.status === "completed" && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Complete
                {activeExec.duration && <span className="text-muted-foreground">({activeExec.duration.toFixed(1)}s)</span>}
              </span>
            )}
          </div>

          {activeExec ? (
            <BulkRunDetail exec={activeExec} />
          ) : (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">Upload a CSV and start a bulk run to see results here</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Bulk Runs
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/bulk-executions"] })}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>

        {listLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : !bulkExecs?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No bulk runs yet. Upload a CSV above to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">ID</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Workflow</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Rows</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Success</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Duration</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Date</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulkExecs.map((exec: BulkExecution) => (
                  <tr key={exec.id} className="border-b border-white/5 hover:bg-secondary/20 cursor-pointer" onClick={() => setActiveExecId(exec.id)}>
                    <td className="py-2.5 font-mono text-xs">#{exec.id}</td>
                    <td className="py-2.5">{exec.workflowName}</td>
                    <td className="py-2.5">
                      <span className={`flex items-center gap-1 text-xs ${
                        exec.status === "completed" ? "text-emerald-400" :
                        exec.status === "running" ? "text-amber-400" : "text-red-400"
                      }`}>
                        {exec.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> :
                         exec.status === "running" ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         <XCircle className="w-3 h-3" />}
                        {exec.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs">{exec.totalRows}</td>
                    <td className="py-2.5 text-xs">
                      <span className="text-emerald-400">{exec.completedRows}</span>
                      {(exec.failedRows || 0) > 0 && <span className="text-red-400 ml-1">/ {exec.failedRows} failed</span>}
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">{exec.duration ? `${exec.duration.toFixed(1)}s` : "—"}</td>
                    <td className="py-2.5 text-xs text-muted-foreground">{format(new Date(exec.createdAt), "MMM d, HH:mm")}</td>
                    <td className="py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); handleDelete(exec.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
