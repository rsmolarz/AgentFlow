import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Webhook, Plus, Copy, Trash2, RefreshCw, Play, Eye, EyeOff,
  ChevronDown, ChevronRight, ExternalLink, Shield, Clock, Loader2, X
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const DOMAIN = typeof window !== "undefined" ? window.location.origin : "";

interface WebhookItem {
  id: number;
  name: string;
  slug: string;
  workflowId: number | null;
  workflowName: string | null;
  method: string;
  enabled: boolean;
  secret: string | null;
  description: string;
  lastCalledAt: string | null;
  callCount: number;
  lastPayload: any;
  lastStatus: string;
  createdAt: string;
}

interface Workflow {
  id: number;
  name: string;
}

export default function WebhooksPage() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [whRes, wfRes] = await Promise.all([
        fetch(`${API_BASE}/api/webhooks`),
        fetch(`${API_BASE}/api/workflows`),
      ]);
      const whData = await whRes.json();
      const wfData = await wfRes.json();
      if (Array.isArray(whData)) setWebhooks(whData);
      if (Array.isArray(wfData)) setWorkflows(wfData);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteWebhook = async (id: number) => {
    if (!confirm("Delete this webhook? This cannot be undone.")) return;
    await fetch(`${API_BASE}/api/webhooks/${id}`, { method: "DELETE" });
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast({ title: "Webhook deleted" });
  };

  const toggleWebhook = async (id: number, enabled: boolean) => {
    await fetch(`${API_BASE}/api/webhooks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled } : w));
    toast({ title: enabled ? "Webhook enabled" : "Webhook disabled" });
  };

  const testWebhook = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Test call sent!", description: "Check the webhook details for the recorded payload." });
        fetchData();
      }
    } catch {
      toast({ title: "Test failed", variant: "destructive" });
    }
  };

  const regenerateSecret = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/webhooks/${id}/regenerate-secret`, { method: "POST" });
    const data = await res.json();
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, secret: data.secret } : w));
    toast({ title: "Secret regenerated" });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
            Webhook Manager
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage incoming webhook URLs for your workflows.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
            </DialogHeader>
            <CreateWebhookForm
              workflows={workflows}
              onSuccess={(wh) => { setWebhooks(prev => [...prev, wh]); setShowCreate(false); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl">
          <Webhook className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No webhooks yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first webhook to start receiving external events.</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <WebhookCard
              key={wh.id}
              webhook={wh}
              expanded={expandedId === wh.id}
              onToggleExpand={() => setExpandedId(expandedId === wh.id ? null : wh.id)}
              onToggle={(enabled) => toggleWebhook(wh.id, enabled)}
              onTest={() => testWebhook(wh.id)}
              onDelete={() => deleteWebhook(wh.id)}
              onRegenerateSecret={() => regenerateSecret(wh.id)}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WebhookCard({ webhook, expanded, onToggleExpand, onToggle, onTest, onDelete, onRegenerateSecret, onCopy }: {
  webhook: WebhookItem; expanded: boolean;
  onToggleExpand: () => void; onToggle: (enabled: boolean) => void;
  onTest: () => void; onDelete: () => void; onRegenerateSecret: () => void;
  onCopy: (text: string, label: string) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const webhookUrl = `${DOMAIN}/api/incoming/${webhook.slug}`;
  const methodColors: Record<string, string> = {
    POST: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    GET: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
    ANY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <div className={`glass-card rounded-xl border transition-all ${webhook.enabled ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onToggleExpand}>
        <Switch checked={webhook.enabled} onCheckedChange={onToggle} onClick={e => e.stopPropagation()} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Webhook className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <h3 className="font-semibold text-sm truncate">{webhook.name}</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${methodColors[webhook.method] || methodColors.POST}`}>
              {webhook.method}
            </span>
            {webhook.workflowName && (
              <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                → {webhook.workflowName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="font-mono truncate max-w-[300px]">{webhookUrl}</span>
            <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {webhook.callCount} calls</span>
            {webhook.lastCalledAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last: {new Date(webhook.lastCalledAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onCopy(webhookUrl, "URL"); }} title="Copy URL">
            <Copy className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onTest(); }} title="Send test call">
            <Play className="w-3 h-3 text-emerald-400" />
          </Button>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Webhook URL</Label>
              <div className="flex gap-1">
                <div className="flex-1 bg-secondary/50 border border-white/10 rounded-lg p-2 text-xs font-mono break-all">
                  {webhookUrl}
                </div>
                <Button variant="outline" size="sm" className="h-auto" onClick={() => onCopy(webhookUrl, "URL")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Signing Secret
              </Label>
              <div className="flex gap-1">
                <div className="flex-1 bg-secondary/50 border border-white/10 rounded-lg p-2 text-xs font-mono break-all">
                  {showSecret ? webhook.secret : "••••••••••••••••••••"}
                </div>
                <Button variant="outline" size="sm" className="h-auto" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button variant="outline" size="sm" className="h-auto" onClick={() => onCopy(webhook.secret || "", "Secret")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {webhook.description && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
              <p className="text-xs text-foreground/80">{webhook.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{webhook.callCount}</p>
              <p className="text-[10px] text-muted-foreground">Total Calls</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className={`text-lg font-bold ${
                webhook.lastStatus === 'success' ? 'text-emerald-400' :
                webhook.lastStatus === 'error' ? 'text-red-400' : 'text-muted-foreground'
              }`}>
                {webhook.lastStatus === 'never' ? '—' : webhook.lastStatus}
              </p>
              <p className="text-[10px] text-muted-foreground">Last Status</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-foreground/80">
                {webhook.lastCalledAt ? new Date(webhook.lastCalledAt).toLocaleTimeString() : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Last Called</p>
            </div>
          </div>

          {webhook.lastPayload && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Last Payload</Label>
              <pre className="bg-black/30 border border-white/10 rounded-lg p-3 text-[11px] font-mono text-muted-foreground max-h-[150px] overflow-auto">
                {JSON.stringify(webhook.lastPayload, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={onTest}>
              <Play className="w-3 h-3" /> Test Webhook
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={onRegenerateSecret}>
              <RefreshCw className="w-3 h-3" /> Regenerate Secret
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:bg-destructive/10 gap-1" onClick={onDelete}>
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateWebhookForm({ workflows, onSuccess }: { workflows: Workflow[]; onSuccess: (wh: WebhookItem) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [method, setMethod] = useState("POST");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description,
          workflowId: workflowId && workflowId !== "none" ? workflowId : null,
          method,
        }),
      });
      if (!res.ok) throw new Error("Failed to create webhook");
      const wh = await res.json();
      toast({ title: "Webhook created!", description: `URL: /api/incoming/${wh.slug}` });
      onSuccess(wh);
    } catch {
      toast({ title: "Error creating webhook", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Stripe Payment Webhook" className="bg-secondary/50 border-white/10" required />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Description (optional)</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What this webhook does..." className="bg-secondary/50 border-white/10 resize-none" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">HTTP Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="ANY">Any Method</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Trigger Workflow</Label>
          <Select value={workflowId} onValueChange={setWorkflowId}>
            <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue placeholder="None (log only)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (log only)</SelectItem>
              {workflows.map(w => (
                <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full gap-2" disabled={saving || !name.trim()}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
        Create Webhook
      </Button>
    </form>
  );
}
