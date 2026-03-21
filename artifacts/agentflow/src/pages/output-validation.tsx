import { useState, useEffect } from "react";
import {
  ShieldCheck, Plus, Search, CheckCircle2, XCircle, AlertTriangle,
  Code2, FileText, Loader2, Trash2, ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: "regex" | "length" | "json_schema" | "content_filter" | "format";
  pattern: string;
  enabled: boolean;
  agentId: number | null;
  passCount: number;
  failCount: number;
}

const defaultRules: ValidationRule[] = [
  { id: "1", name: "No PII Leakage", description: "Blocks outputs containing SSN, credit card, or phone patterns", type: "content_filter", pattern: "\\b\\d{3}-\\d{2}-\\d{4}\\b|\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b", enabled: true, agentId: null, passCount: 142, failCount: 3 },
  { id: "2", name: "Valid JSON Output", description: "Ensures structured outputs are valid JSON", type: "json_schema", pattern: "{}", enabled: true, agentId: null, passCount: 89, failCount: 7 },
  { id: "3", name: "Response Length Limit", description: "Caps response length at 4000 characters", type: "length", pattern: "4000", enabled: true, agentId: null, passCount: 200, failCount: 1 },
  { id: "4", name: "No Harmful Content", description: "Filters outputs for harmful, biased, or inappropriate content", type: "content_filter", pattern: "harm|violence|hate", enabled: true, agentId: null, passCount: 195, failCount: 0 },
  { id: "5", name: "Email Format Check", description: "Validates email-type outputs match proper format", type: "format", pattern: "email", enabled: false, agentId: null, passCount: 45, failCount: 2 },
];

const typeColors: Record<string, string> = {
  regex: "text-blue-400 bg-blue-500/10",
  length: "text-amber-400 bg-amber-500/10",
  json_schema: "text-emerald-400 bg-emerald-500/10",
  content_filter: "text-red-400 bg-red-500/10",
  format: "text-violet-400 bg-violet-500/10",
};

export default function OutputValidation() {
  const [rules, setRules] = useState<ValidationRule[]>(defaultRules);
  const [search, setSearch] = useState("");

  const filtered = rules.filter(r =>
    search === "" || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPass = rules.reduce((s, r) => s + r.passCount, 0);
  const totalFail = rules.reduce((s, r) => s + r.failCount, 0);
  const passRate = totalPass + totalFail > 0 ? ((totalPass / (totalPass + totalFail)) * 100).toFixed(1) : "100";

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Output Validation
          </h1>
          <p className="text-muted-foreground mt-1">
            Define validation rules to ensure agent outputs meet quality and safety standards.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Active Rules</div>
          <div className="text-2xl font-bold text-foreground mt-1">{rules.filter(r => r.enabled).length}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Checks</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{(totalPass + totalFail).toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Pass Rate</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{passRate}%</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Violations</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{totalFail}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card border-border/50" />
      </div>

      <div className="space-y-3">
        {filtered.map(rule => {
          const colorClass = typeColors[rule.type] || typeColors.regex;
          const total = rule.passCount + rule.failCount;
          const rate = total > 0 ? ((rule.passCount / total) * 100).toFixed(0) : "100";
          return (
            <div key={rule.id} className={`bg-card border rounded-xl p-5 transition-all ${rule.enabled ? "border-border/50" : "border-border/30 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{rule.name}</h3>
                      <Badge variant="outline" className={`text-xs ${colorClass}`}>
                        {rule.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {rule.passCount} passed
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" /> {rule.failCount} failed
                      </span>
                      <span>{rate}% pass rate</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleRule(rule.id)} className="ml-4 flex-shrink-0">
                  {rule.enabled ?
                    <ToggleRight className="w-8 h-8 text-emerald-400" /> :
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
