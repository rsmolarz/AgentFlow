import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListAgents } from "@workspace/api-client-react";
import {
  GitCompareArrows, Plus, Play, Trash2, ChevronRight, Trophy, Clock,
  DollarSign, Zap, Loader2, ArrowLeft, BarChart3, MessageSquare, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AbTest {
  id: number;
  name: string;
  description: string;
  status: string;
  agentAId: number;
  agentBId: number;
  testPrompts: string[];
  totalRuns: number;
  createdAt: string;
}

interface AbTestResult {
  id: number;
  testId: number;
  prompt: string;
  agentAResponse: string;
  agentBResponse: string;
  agentATokens: number;
  agentBTokens: number;
  agentADuration: number;
  agentBDuration: number;
  agentACost: number;
  agentBCost: number;
  winner: string;
  scores: {
    agentA: { relevance: number; coherence: number; helpfulness: number; overall: number };
    agentB: { relevance: number; coherence: number; helpfulness: number; overall: number };
  } | null;
}

interface AbTestDetail extends AbTest {
  results: AbTestResult[];
  agentA: { id: number; name: string; model: string; provider: string; icon: string; color: string };
  agentB: { id: number; name: string; model: string; provider: string; icon: string; color: string };
}

const BASE = import.meta.env.BASE_URL;

function useAbTests() {
  return useQuery<AbTest[]>({
    queryKey: ["/api/ab-tests"],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/ab-tests`);
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
  });
}

function useAbTestDetail(id: number | null) {
  return useQuery<AbTestDetail>({
    queryKey: ["/api/ab-tests", id],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/ab-tests/${id}`);
      if (!r.ok) throw new Error("Failed to fetch");
      return r.json();
    },
    enabled: id !== null,
  });
}

function ScoreBar({ label, scoreA, scoreB }: { label: string; scoreA: number; scoreB: number }) {
  const maxScore = 10;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{scoreA.toFixed(1)}</span>
        <span className="font-medium text-foreground">{label}</span>
        <span>{scoreB.toFixed(1)}</span>
      </div>
      <div className="flex gap-0.5 h-2">
        <div className="flex-1 bg-secondary/50 rounded-l-full overflow-hidden flex justify-end">
          <div
            className="bg-blue-500 rounded-l-full transition-all"
            style={{ width: `${(scoreA / maxScore) * 100}%` }}
          />
        </div>
        <div className="flex-1 bg-secondary/50 rounded-r-full overflow-hidden">
          <div
            className="bg-amber-500 rounded-r-full transition-all"
            style={{ width: `${(scoreB / maxScore) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CreateTestDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data: agents } = useListAgents();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentAId, setAgentAId] = useState("");
  const [agentBId, setAgentBId] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !agentAId || !agentBId) {
      toast({ title: "Missing fields", description: "Please fill in the test name and select both agents.", variant: "destructive" });
      return;
    }
    if (agentAId === agentBId) {
      toast({ title: "Same agent", description: "Please select two different agents to compare.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const testPrompts = promptsText.split("\n").map(p => p.trim()).filter(Boolean);
      const r = await fetch(`${BASE}api/ab-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          agentAId: Number(agentAId),
          agentBId: Number(agentBId),
          testPrompts: testPrompts.length > 0 ? testPrompts : ["Explain your role and capabilities in detail."],
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed to create");
      toast({ title: "Test created", description: "Your A/B test is ready to run." });
      onCreated();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitCompareArrows className="w-5 h-5 text-primary" />
            New A/B Test
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Test Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Customer Support Agent Comparison"
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Description (optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Compare tone and accuracy between two agent configs"
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-blue-400 mb-1 block">Agent A</label>
              <select
                value={agentAId}
                onChange={e => setAgentAId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select agent...</option>
                {agents?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-amber-400 mb-1 block">Agent B</label>
              <select
                value={agentBId}
                onChange={e => setAgentBId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select agent...</option>
                {agents?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Test Prompts (one per line)</label>
            <textarea
              value={promptsText}
              onChange={e => setPromptsText(e.target.value)}
              rows={4}
              placeholder={"Explain your role and capabilities.\nDraft a response to a customer complaint.\nSummarize this article about AI trends."}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Each prompt will be sent to both agents for comparison. Leave blank for a default prompt.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Test
          </Button>
        </div>
      </div>
    </div>
  );
}

function TestDetailView({ testId, onBack }: { testId: number; onBack: () => void }) {
  const { data: test, isLoading, refetch } = useAbTestDetail(testId);
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  const handleRun = async () => {
    setRunning(true);
    try {
      const r = await fetch(`${BASE}api/ab-tests/${testId}/run`, { method: "POST" });
      if (!r.ok) throw new Error((await r.json()).error || "Failed to run");
      toast({ title: "Test completed", description: "Results are ready to review." });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const summary = useMemo(() => {
    if (!test?.results?.length) return null;
    const r = test.results;
    const winsA = r.filter(x => x.winner === "A").length;
    const winsB = r.filter(x => x.winner === "B").length;
    const ties = r.filter(x => x.winner === "tie").length;
    const avgScoreA = r.reduce((s, x) => s + (x.scores?.agentA?.overall || 0), 0) / r.length;
    const avgScoreB = r.reduce((s, x) => s + (x.scores?.agentB?.overall || 0), 0) / r.length;
    const totalTokensA = r.reduce((s, x) => s + (x.agentATokens || 0), 0);
    const totalTokensB = r.reduce((s, x) => s + (x.agentBTokens || 0), 0);
    const avgDurationA = r.reduce((s, x) => s + (x.agentADuration || 0), 0) / r.length;
    const avgDurationB = r.reduce((s, x) => s + (x.agentBDuration || 0), 0) / r.length;
    const totalCostA = r.reduce((s, x) => s + (x.agentACost || 0), 0);
    const totalCostB = r.reduce((s, x) => s + (x.agentBCost || 0), 0);
    const avgRelevA = r.reduce((s, x) => s + (x.scores?.agentA?.relevance || 0), 0) / r.length;
    const avgRelevB = r.reduce((s, x) => s + (x.scores?.agentB?.relevance || 0), 0) / r.length;
    const avgCoherA = r.reduce((s, x) => s + (x.scores?.agentA?.coherence || 0), 0) / r.length;
    const avgCoherB = r.reduce((s, x) => s + (x.scores?.agentB?.coherence || 0), 0) / r.length;
    const avgHelpA = r.reduce((s, x) => s + (x.scores?.agentA?.helpfulness || 0), 0) / r.length;
    const avgHelpB = r.reduce((s, x) => s + (x.scores?.agentB?.helpfulness || 0), 0) / r.length;
    return { winsA, winsB, ties, avgScoreA, avgScoreB, totalTokensA, totalTokensB, avgDurationA, avgDurationB, totalCostA, totalCostB, avgRelevA, avgRelevB, avgCoherA, avgCoherB, avgHelpA, avgHelpB };
  }, [test?.results]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!test) return null;

  const overallWinner = summary
    ? summary.winsA > summary.winsB ? "A" : summary.winsB > summary.winsA ? "B" : "Tie"
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{test.name}</h2>
          {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          test.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
          test.status === "running" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
          "bg-secondary text-muted-foreground border border-border"
        }`}>
          {test.status}
        </div>
        <Button onClick={handleRun} disabled={running}>
          {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {running ? "Running..." : "Run Test"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-blue-400">Agent A</span>
          </div>
          <p className="text-base font-bold">{test.agentA?.name || `Agent #${test.agentAId}`}</p>
          <p className="text-xs text-muted-foreground">{test.agentA?.provider} / {test.agentA?.model}</p>
        </div>
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-400">Agent B</span>
          </div>
          <p className="text-base font-bold">{test.agentB?.name || `Agent #${test.agentBId}`}</p>
          <p className="text-xs text-muted-foreground">{test.agentB?.provider} / {test.agentB?.model}</p>
        </div>
      </div>

      {running && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-amber-400">Running A/B test...</p>
          <p className="text-xs text-muted-foreground mt-1">Sending {test.testPrompts?.length || 1} prompt(s) to both agents and evaluating responses. This may take a minute.</p>
        </div>
      )}

      {summary && (
        <>
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Results Summary
            </h3>

            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">Overall Winner</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold ${
                overallWinner === "A" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                overallWinner === "B" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                "bg-secondary text-muted-foreground border border-border"
              }`}>
                <Trophy className="w-5 h-5" />
                {overallWinner === "A" ? test.agentA?.name :
                 overallWinner === "B" ? test.agentB?.name : "It's a Tie"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                A wins: {summary.winsA} &middot; B wins: {summary.winsB} &middot; Ties: {summary.ties}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <BarChart3 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Score A</p>
                <p className="text-lg font-bold text-blue-400">{summary.avgScoreA.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <BarChart3 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Score B</p>
                <p className="text-lg font-bold text-amber-400">{summary.avgScoreB.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Speed A</p>
                <p className="text-lg font-bold text-blue-400">{summary.avgDurationA.toFixed(1)}s</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 text-center">
                <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Speed B</p>
                <p className="text-lg font-bold text-amber-400">{summary.avgDurationB.toFixed(1)}s</p>
              </div>
            </div>

            <div className="space-y-3">
              <ScoreBar label="Relevance" scoreA={summary.avgRelevA} scoreB={summary.avgRelevB} />
              <ScoreBar label="Coherence" scoreA={summary.avgCoherA} scoreB={summary.avgCoherB} />
              <ScoreBar label="Helpfulness" scoreA={summary.avgHelpA} scoreB={summary.avgHelpB} />
              <ScoreBar label="Overall" scoreA={summary.avgScoreA} scoreB={summary.avgScoreB} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tokens</span>
                <span><span className="text-blue-400 font-medium">{summary.totalTokensA.toLocaleString()}</span> vs <span className="text-amber-400 font-medium">{summary.totalTokensB.toLocaleString()}</span></span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span><span className="text-blue-400 font-medium">${summary.totalCostA.toFixed(4)}</span> vs <span className="text-amber-400 font-medium">${summary.totalCostB.toFixed(4)}</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Individual Results ({test.results.length})
            </h3>
            {test.results.map((result) => (
              <div key={result.id} className="rounded-xl border border-border bg-card/60 overflow-hidden">
                <button
                  onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">&ldquo;{result.prompt}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-medium ${
                        result.winner === "A" ? "text-blue-400" :
                        result.winner === "B" ? "text-amber-400" :
                        "text-muted-foreground"
                      }`}>
                        Winner: {result.winner === "A" ? test.agentA?.name : result.winner === "B" ? test.agentB?.name : "Tie"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Scores: <span className="text-blue-400">{result.scores?.agentA?.overall || 0}</span> vs <span className="text-amber-400">{result.scores?.agentB?.overall || 0}</span>
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedResult === result.id ? "rotate-90" : ""}`} />
                </button>
                {expandedResult === result.id && (
                  <div className="border-t border-border p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium text-blue-400">{test.agentA?.name} Response</span>
                          <span className="text-xs text-muted-foreground ml-auto">{result.agentATokens} tokens &middot; {result.agentADuration}s</span>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {result.agentAResponse}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-amber-400">{test.agentB?.name} Response</span>
                          <span className="text-xs text-muted-foreground ml-auto">{result.agentBTokens} tokens &middot; {result.agentBDuration}s</span>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {result.agentBResponse}
                        </div>
                      </div>
                    </div>
                    {result.scores && (
                      <div className="pt-3 border-t border-border space-y-2">
                        <ScoreBar label="Relevance" scoreA={result.scores.agentA.relevance} scoreB={result.scores.agentB.relevance} />
                        <ScoreBar label="Coherence" scoreA={result.scores.agentA.coherence} scoreB={result.scores.agentB.coherence} />
                        <ScoreBar label="Helpfulness" scoreA={result.scores.agentA.helpfulness} scoreB={result.scores.agentB.helpfulness} />
                        <ScoreBar label="Overall" scoreA={result.scores.agentA.overall} scoreB={result.scores.agentB.overall} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!summary && !running && (
        <div className="rounded-xl border border-border bg-card/60 p-12 text-center">
          <GitCompareArrows className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-lg font-medium mb-1">Ready to Run</p>
          <p className="text-sm text-muted-foreground mb-4">Click "Run Test" to send {test.testPrompts?.length || 1} prompt(s) to both agents and compare their outputs.</p>
          <Button onClick={handleRun}>
            <Play className="w-4 h-4 mr-2" />
            Run Test Now
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ABTesting() {
  const { data: tests, isLoading, refetch } = useAbTests();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const r = await fetch(`${BASE}api/ab-tests/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete");
      toast({ title: "Test deleted" });
      refetch();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (selectedTestId !== null) {
    return (
      <div className="max-w-5xl mx-auto">
        <TestDetailView testId={selectedTestId} onBack={() => { setSelectedTestId(null); refetch(); }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
            A/B Testing
          </h1>
          <p className="text-muted-foreground mt-1">Compare agent configurations side by side with AI-judged scoring.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New A/B Test
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : tests && tests.length > 0 ? (
        <div className="space-y-3">
          {tests.map(test => (
            <div
              key={test.id}
              onClick={() => setSelectedTestId(test.id)}
              className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <GitCompareArrows className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold truncate">{test.name}</h3>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                      test.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                      test.status === "running" ? "bg-amber-500/10 text-amber-400" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {test.status}
                    </div>
                  </div>
                  {test.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{test.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{test.testPrompts?.length || 0} prompt(s)</span>
                    <span>{test.totalRuns || 0} result(s)</span>
                    <span>{format(new Date(test.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(test.id, e)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/60 p-16 text-center">
          <GitCompareArrows className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-medium mb-1">No A/B Tests Yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create an A/B test to compare two agent configurations side by side. Each test sends the same prompts to both agents and uses AI to judge which responds better.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Test
          </Button>
        </div>
      )}

      {showCreate && (
        <CreateTestDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refetch(); }}
        />
      )}
    </div>
  );
}
