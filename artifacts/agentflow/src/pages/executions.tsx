import { useListExecutions } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ActivitySquare, Play, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Executions() {
  const { data: executions, isLoading } = useListExecutions({ limit: 100 });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
      case 'failed': return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
      case 'running': return { icon: Play, color: "text-primary", bg: "bg-primary/10 border-primary/20", extra: "animate-pulse" };
      default: return { icon: Clock, color: "text-muted-foreground", bg: "bg-secondary border-border" };
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient">Executions</h1>
        <p className="text-muted-foreground mt-1">Detailed logs of all workflow runs.</p>
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
                <th className="px-6 py-4 font-medium tracking-wider text-right">Logs</th>
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
              ) : executions?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No executions recorded yet.
                  </td>
                </tr>
              ) : (
                executions?.items.map((exec) => {
                  const status = getStatusConfig(exec.status);
                  const Icon = status.icon;
                  return (
                    <tr key={exec.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={`capitalize font-semibold border px-2.5 py-1 ${status.bg} ${status.color}`}>
                          <Icon className={`w-3.5 h-3.5 mr-1.5 ${status.extra || ''}`} />
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
                        <button className="p-2 rounded-lg text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
