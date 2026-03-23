import { useState, useEffect, useCallback } from "react";
import { useGetSettings, useUpsertSetting } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Settings as SettingsIcon, Key, Shield, Server, Globe, Brain, Save, Plus, Trash2, Copy,
  Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw, ExternalLink, Lock, Info, HelpCircle,
  Webhook, Cpu, Layers, Users, Bell, Palette, Code2, Terminal, DollarSign, TrendingUp,
  RotateCcw, Loader2, Fingerprint, ShieldCheck, XCircle, Usb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const TABS = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "providers", label: "LLM Providers", icon: Brain },
  { id: "mcp", label: "MCP Server", icon: Server },
  { id: "security", label: "Security & SSO", icon: Shield },
  { id: "api", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "advanced", label: "Advanced", icon: Terminal },
];

interface Provider {
  id: string;
  name: string;
  icon: string;
  configured: boolean;
  apiKey?: string;
  models: string[];
  endpoint?: string;
}

const PROVIDERS: Provider[] = [
  { id: "openai", name: "OpenAI", icon: "🤖", configured: true, apiKey: "sk-...abc123", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-preview", "o1-mini"] },
  { id: "anthropic", name: "Anthropic", icon: "🧠", configured: true, apiKey: "sk-ant-...xyz789", models: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"] },
  { id: "google", name: "Google AI", icon: "✨", configured: true, apiKey: "AIza...def456", models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"] },
  { id: "mistral", name: "Mistral AI", icon: "🌪️", configured: false, models: ["mistral-large", "mistral-medium", "codestral"] },
  { id: "cohere", name: "Cohere", icon: "💎", configured: false, models: ["command-r-plus", "command-r", "embed-english"] },
  { id: "ollama", name: "Ollama (Local)", icon: "🦙", configured: false, models: ["llama3", "mistral", "codellama", "phi-3"], endpoint: "http://localhost:11434" },
  { id: "azure", name: "Azure OpenAI", icon: "☁️", configured: false, models: ["gpt-4o", "gpt-4-turbo"], endpoint: "https://your-resource.openai.azure.com/" },
  { id: "bedrock", name: "AWS Bedrock", icon: "🏔️", configured: false, models: ["claude-3-sonnet", "titan-text-premier"] },
  { id: "groq", name: "Groq", icon: "⚡", configured: false, models: ["llama-3.1-70b", "mixtral-8x7b"] },
  { id: "together", name: "Together AI", icon: "🔗", configured: false, models: ["llama-3.1-405b", "qwen-2-72b"] },
];

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [dbApiKeys, setDbApiKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [yubiKeyRegistered, setYubiKeyRegistered] = useState(false);
  const [webauthnCreds, setWebauthnCreds] = useState<any[]>([]);
  const [revealingKeyId, setRevealingKeyId] = useState<number | null>(null);
  const [yubiKeyVerifying, setYubiKeyVerifying] = useState(false);
  const [revealedKeyHash, setRevealedKeyHash] = useState<{ id: number; hash: string } | null>(null);
  const [registeringYubiKey, setRegisteringYubiKey] = useState(false);

  const { data: settings } = useGetSettings();
  const upsertSetting = useUpsertSetting();

  const [platformName, setPlatformName] = useState("AgentFlow");
  const [defaultProvider, setDefaultProvider] = useState("openai");
  const [defaultModel, setDefaultModel] = useState("gpt-4o");
  const [costControlsEnabled, setCostControlsEnabled] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState("1000000");
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const [maxConcurrent, setMaxConcurrent] = useState("10");
  const [execTimeout, setExecTimeout] = useState("300");
  const [codeRuntime, setCodeRuntime] = useState("both");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchApiKeys = useCallback(() => {
    setLoadingKeys(true);
    fetch(`${API_BASE}/api/api-keys`)
      .then(r => r.json())
      .then(d => { setDbApiKeys(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => setLoadingKeys(false));
  }, []);

  const fetchWebauthnCreds = useCallback(() => {
    fetch(`${API_BASE}/api/webauthn/credentials`)
      .then(r => r.json())
      .then(d => {
        const creds = Array.isArray(d) ? d : [];
        setWebauthnCreds(creds);
        setYubiKeyRegistered(creds.length > 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "api" || activeTab === "security") {
      fetchApiKeys();
      fetchWebauthnCreds();
    }
  }, [activeTab, fetchApiKeys, fetchWebauthnCreds]);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim() || newKeyScopes.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim(), scopes: newKeyScopes }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Create failed"); }
      const data = await res.json();
      if (data.rawKey) {
        setJustCreatedKey(data.rawKey);
        toast({ title: `API key "${newKeyName}" created!` });
        fetchApiKeys();
      }
    } catch {
      toast({ title: "Failed to create API key", variant: "destructive" });
    }
  };

  const handleDeleteApiKey = async (id: number, name: string) => {
    if (!confirm(`Delete API key "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Delete failed"); }
      toast({ title: `API key "${name}" deleted.` });
      fetchApiKeys();
      if (revealedKeyHash?.id === id) setRevealedKeyHash(null);
    } catch (err: any) {
      toast({ title: err.message || "Failed to delete key", variant: "destructive" });
    }
  };

  const handleRevokeApiKey = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/api-keys/${id}/revoke`, { method: "POST" });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Revoke failed"); }
      toast({ title: "API key revoked" });
      fetchApiKeys();
    } catch (err: any) {
      toast({ title: err.message || "Failed to revoke key", variant: "destructive" });
    }
  };

  const handleRegisterYubiKey = async () => {
    setRegisteringYubiKey(true);
    try {
      const optionsRes = await fetch(`${API_BASE}/api/webauthn/register-options`, { method: "POST" });
      const optionsData = await optionsRes.json();
      if (!optionsData.publicKey) throw new Error("Failed to get registration options");

      const pubKey = optionsData.publicKey;
      const b64urlDecode = (s: string) => {
        let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      };
      pubKey.challenge = b64urlDecode(pubKey.challenge);
      pubKey.user.id = b64urlDecode(pubKey.user.id);

      const credential = await navigator.credentials.create({ publicKey: pubKey }) as PublicKeyCredential;
      if (!credential) throw new Error("Registration cancelled");

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

      const regRes = await fetch(`${API_BASE}/api/webauthn/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: optionsData.sessionId,
          credential: { id: credentialId, publicKey: credentialId, deviceName: "YubiKey" },
        }),
      });
      const regData = await regRes.json();
      if (regData.success) {
        toast({ title: "YubiKey registered successfully!" });
        fetchWebauthnCreds();
      } else {
        throw new Error("Registration failed");
      }
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        toast({ title: err.message || "YubiKey registration failed", variant: "destructive" });
      }
    } finally {
      setRegisteringYubiKey(false);
    }
  };

  const handleYubiKeyAuth = async (apiKeyId: number) => {
    setRevealingKeyId(apiKeyId);
    setYubiKeyVerifying(true);
    try {
      const optionsRes = await fetch(`${API_BASE}/api/webauthn/auth-options`, { method: "POST" });
      const optionsData = await optionsRes.json();
      if (optionsData.error) throw new Error(optionsData.error);

      const pubKey = optionsData.publicKey;
      const b64urlDecode = (s: string) => {
        let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      };
      pubKey.challenge = b64urlDecode(pubKey.challenge);
      pubKey.allowCredentials = pubKey.allowCredentials.map((c: any) => ({
        ...c,
        id: b64urlDecode(c.id),
      }));

      const assertion = await navigator.credentials.get({ publicKey: pubKey }) as PublicKeyCredential;
      if (!assertion) throw new Error("Authentication cancelled");

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

      const authRes = await fetch(`${API_BASE}/api/webauthn/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: optionsData.sessionId,
          credential: { id: credentialId },
          apiKeyId,
        }),
      });
      const authData = await authRes.json();
      if (authData.success && authData.apiKey) {
        setRevealedKeyHash({ id: apiKeyId, hash: authData.apiKey.keyHash });
        toast({ title: "YubiKey verified — key hash revealed" });
      } else {
        throw new Error("Verification failed");
      }
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        toast({ title: err.message || "YubiKey authentication failed", variant: "destructive" });
      }
    } finally {
      setYubiKeyVerifying(false);
      setRevealingKeyId(null);
    }
  };

  const handleDeleteWebauthnCred = async (id: number) => {
    if (!confirm("Remove this YubiKey? You will need to register a new one for key protection.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/webauthn/credentials/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Delete failed"); }
      toast({ title: "YubiKey removed" });
      fetchWebauthnCreds();
    } catch (err: any) {
      toast({ title: err.message || "Failed to remove YubiKey", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (settings && !settingsLoaded) {
      if (settings.platformName) setPlatformName(settings.platformName);
      if (settings.defaultProvider) setDefaultProvider(settings.defaultProvider);
      if (settings.defaultModel) setDefaultModel(settings.defaultModel);
      if (settings.costControlsEnabled) setCostControlsEnabled(settings.costControlsEnabled === "true");
      if (settings.monthlyBudget) setMonthlyBudget(settings.monthlyBudget);
      if (settings.streamingEnabled) setStreamingEnabled(settings.streamingEnabled !== "false");
      if (settings.loggingEnabled) setLoggingEnabled(settings.loggingEnabled !== "false");
      if (settings.maxConcurrentExecutions) setMaxConcurrent(settings.maxConcurrentExecutions);
      if (settings.executionTimeout) setExecTimeout(settings.executionTimeout);
      if (settings.codeRuntime) setCodeRuntime(settings.codeRuntime);
      setSettingsLoaded(true);
    }
  }, [settings, settingsLoaded]);

  const saveSetting = (key: string, value: string, category = "general") => {
    upsertSetting.mutate({ data: { key, value, category } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings"] }); },
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveMultipleSettings = async (entries: { key: string; value: string; category: string }[]) => {
    setIsSaving(true);
    try {
      const results = await Promise.allSettled(
        entries.map(entry =>
          new Promise<void>((resolve, reject) => {
            upsertSetting.mutate({ data: entry }, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            });
          })
        )
      );
      const failed = results.filter(r => r.status === "rejected");
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      if (failed.length > 0) {
        toast({ title: `${failed.length} setting(s) failed to save`, variant: "destructive" });
      } else {
        toast({ title: "Settings saved successfully!" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    saveMultipleSettings([
      { key: "platformName", value: platformName, category: "general" },
      { key: "defaultProvider", value: defaultProvider, category: "general" },
      { key: "defaultModel", value: defaultModel, category: "general" },
      { key: "costControlsEnabled", value: String(costControlsEnabled), category: "general" },
      { key: "monthlyBudget", value: monthlyBudget, category: "general" },
      { key: "streamingEnabled", value: String(streamingEnabled), category: "general" },
      { key: "loggingEnabled", value: String(loggingEnabled), category: "general" },
    ]);
  };

  const handleSaveAdvanced = () => {
    saveMultipleSettings([
      { key: "maxConcurrentExecutions", value: maxConcurrent, category: "advanced" },
      { key: "executionTimeout", value: execTimeout, category: "advanced" },
      { key: "codeRuntime", value: codeRuntime, category: "advanced" },
    ]);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your platform, AI providers, security, and integrations.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <nav className="sm:w-56 flex-shrink-0">
          <div className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card/60 p-6 space-y-5">
                <h2 className="text-lg font-semibold">General Settings</h2>
                
                <div className="space-y-1.5">
                  <Label>Platform Name</Label>
                  <Input value={platformName} onChange={e => setPlatformName(e.target.value)} className="bg-secondary/50 border-white/10" />
                </div>

                <div className="space-y-1.5">
                  <Label>Default LLM Provider</Label>
                  <Select value={defaultProvider} onValueChange={setDefaultProvider}>
                    <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Default Model</Label>
                  <Select value={defaultModel} onValueChange={setDefaultModel}>
                    <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Cost Controls</Label>
                    <p className="text-[10px] text-muted-foreground">Set monthly budget limits and get alerts when approaching thresholds</p>
                  </div>
                  <Switch checked={costControlsEnabled} onCheckedChange={setCostControlsEnabled} />
                </div>

                <div className="space-y-1.5">
                  <Label>Monthly Token Budget</Label>
                  <Input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} className="bg-secondary/50 border-white/10" />
                  <p className="text-[10px] text-muted-foreground">Maximum tokens across all agents per month. Agent runs will be paused when limit is reached.</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Streaming Responses</Label>
                    <p className="text-[10px] text-muted-foreground">Enable token-by-token streaming for real-time agent output</p>
                  </div>
                  <Switch checked={streamingEnabled} onCheckedChange={setStreamingEnabled} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Execution Logging</Label>
                    <p className="text-[10px] text-muted-foreground">Log all inputs, outputs, and intermediate steps for debugging</p>
                  </div>
                  <Switch checked={loggingEnabled} onCheckedChange={setLoggingEnabled} />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-white">
                  {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "providers" && (
            <div className="space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Configure API keys for each AI provider. Your agents can use any configured provider. Supports OpenAI, Anthropic, Google, Mistral, Cohere, local models (Ollama), and cloud providers (Azure, AWS Bedrock).
                </p>
              </div>

              {PROVIDERS.map(provider => (
                <div key={provider.id} className={`rounded-xl border p-4 ${provider.configured ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-secondary/20'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{provider.name}</h3>
                        {provider.configured && (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                            <CheckCircle className="w-2.5 h-2.5" /> Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Models: {provider.models.join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.configured ? (
                        <>
                          <div className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded font-mono">
                            {showApiKey === provider.id ? provider.apiKey : "••••••••••••"}
                            <button onClick={() => setShowApiKey(showApiKey === provider.id ? null : provider.id)}>
                              {showApiKey === provider.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 text-xs border-white/10">Edit</Button>
                        </>
                      ) : (
                        <Button size="sm" className="h-8 text-xs bg-primary/80 hover:bg-primary text-white">
                          <Key className="w-3 h-3 mr-1" /> Configure
                        </Button>
                      )}
                    </div>
                  </div>
                  {provider.endpoint && (
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Endpoint: {provider.endpoint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "mcp" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card/60 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Server className="w-5 h-5 text-primary" />
                      MCP Server Configuration
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Enable the Model Context Protocol server to let external AI systems call your workflows as tools.</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p><strong className="text-foreground">What is MCP?</strong> The Model Context Protocol (MCP) allows other AI systems (like Claude Desktop, Cursor, or other AI agents) to discover and call your AgentFlow workflows as tools. This enables interoperability across platforms.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>MCP Server URL</Label>
                  <div className="flex gap-2">
                    <Input defaultValue="https://your-instance.agentflow.app/mcp" className="bg-secondary/50 border-white/10 font-mono text-sm" readOnly />
                    <Button variant="outline" size="icon" className="h-9 w-9 border-white/10" onClick={() => toast({ title: "URL copied!" })}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Exposed Workflows</Label>
                  <p className="text-[10px] text-muted-foreground">Choose which workflows are available as MCP tools</p>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Active Workflows</SelectItem>
                      <SelectItem value="tagged">Tagged Workflows Only</SelectItem>
                      <SelectItem value="none">None (Disabled)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Authentication Required</Label>
                    <p className="text-[10px] text-muted-foreground">Require API key authentication for MCP tool calls</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Rate Limiting</Label>
                    <p className="text-[10px] text-muted-foreground">Limit MCP requests to prevent abuse</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-1.5">
                  <Label>Rate Limit</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="100" className="bg-secondary/50 border-white/10 w-24" />
                    <span className="text-sm text-muted-foreground">requests per minute</span>
                  </div>
                </div>

                <Button onClick={handleSave} className="bg-primary text-white">
                  <Save className="w-4 h-4 mr-2" /> Save MCP Settings
                </Button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card/60 p-6 space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Single Sign-On (SSO)
                </h2>
                <p className="text-sm text-muted-foreground">Configure enterprise SSO via OIDC or SAML for team access.</p>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Enable SSO</Label>
                    <p className="text-[10px] text-muted-foreground">Require team members to authenticate via your identity provider</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-1.5">
                  <Label>SSO Protocol</Label>
                  <Select defaultValue="oidc">
                    <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oidc">OpenID Connect (OIDC)</SelectItem>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Identity Provider</Label>
                  <Select defaultValue="okta">
                    <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="okta">Okta</SelectItem>
                      <SelectItem value="auth0">Auth0</SelectItem>
                      <SelectItem value="azure_ad">Azure AD / Entra</SelectItem>
                      <SelectItem value="keycloak">Keycloak</SelectItem>
                      <SelectItem value="onelogin">OneLogin</SelectItem>
                      <SelectItem value="custom">Custom OIDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Issuer URL</Label>
                  <Input placeholder="https://your-tenant.okta.com" className="bg-secondary/50 border-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Client ID</Label>
                    <Input placeholder="Enter client ID" className="bg-secondary/50 border-white/10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client Secret</Label>
                    <Input type="password" placeholder="Enter client secret" className="bg-secondary/50 border-white/10" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-6 space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  Agent Guardrails
                </h2>
                <p className="text-sm text-muted-foreground">Global safety controls applied to all agent outputs.</p>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Input Validation</Label>
                    <p className="text-[10px] text-muted-foreground">Scan all inputs for prompt injection and malicious content</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Output Moderation</Label>
                    <p className="text-[10px] text-muted-foreground">Filter agent outputs for harmful, biased, or inappropriate content</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>PII Detection</Label>
                    <p className="text-[10px] text-muted-foreground">Detect and redact personally identifiable information in outputs</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-1.5">
                  <Label>Blocked Topics</Label>
                  <Textarea 
                    placeholder="Enter topics to block, one per line..."
                    className="bg-secondary/50 border-white/10 resize-none"
                    rows={3}
                  />
                  <p className="text-[10px] text-muted-foreground">Agent responses containing these topics will be filtered and replaced with a safety message.</p>
                </div>

                <Button onClick={handleSave} className="bg-primary text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Security Settings
                </Button>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">API Keys</h2>
                  <p className="text-sm text-muted-foreground">Manage API keys for external access to AgentFlow. Keys are shown once on creation — viewing the hash again requires YubiKey authentication.</p>
                </div>
                <Button className="bg-primary text-white" size="sm" onClick={() => { setShowCreateKey(true); setNewKeyName(""); setNewKeyScopes(["read"]); setJustCreatedKey(null); }}>
                  <Plus className="w-4 h-4 mr-1" /> Create Key
                </Button>
              </div>

              {yubiKeyRegistered && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">YubiKey protection active — {webauthnCreds.length} key(s) registered</span>
                </div>
              )}

              {!yubiKeyRegistered && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-300 font-medium">No YubiKey registered</p>
                    <p className="text-[10px] text-amber-400/70">Register a YubiKey to enable hardware-protected access to your API key hashes.</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                    onClick={handleRegisterYubiKey} disabled={registeringYubiKey}>
                    {registeringYubiKey ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Usb className="w-3 h-3 mr-1" />}
                    Register YubiKey
                  </Button>
                </div>
              )}

              {showCreateKey && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    {justCreatedKey ? "Key Created Successfully" : "Create New API Key"}
                  </h3>

                  {justCreatedKey ? (
                    <div className="space-y-3">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-xs text-red-300 flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Copy this key now. It will never be shown in plain text again. Re-accessing requires YubiKey authentication and only reveals the SHA-256 hash.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-black/30 px-3 py-1.5 rounded font-mono flex-1 select-all break-all text-emerald-300">
                            {justCreatedKey}
                          </code>
                          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(justCreatedKey); toast({ title: "API key copied to clipboard!" }); }}>
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setShowCreateKey(false); setJustCreatedKey(null); }}>
                        Done
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1">Key Name</Label>
                        <Input placeholder="e.g. Production API Key" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Permissions</Label>
                        <div className="flex gap-3">
                          {["read", "write", "execute"].map(scope => (
                            <label key={scope} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newKeyScopes.includes(scope)}
                                onChange={(e) => {
                                  if (e.target.checked) setNewKeyScopes([...newKeyScopes, scope]);
                                  else setNewKeyScopes(newKeyScopes.filter(s => s !== scope));
                                }}
                                className="rounded border-border"
                              />
                              <span className="text-sm capitalize">{scope}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={!newKeyName.trim() || newKeyScopes.length === 0} onClick={handleCreateApiKey}>
                          <Plus className="w-4 h-4 mr-1" /> Generate Key
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCreateKey(false)}>Cancel</Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {loadingKeys ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="rounded-xl border border-white/5 bg-secondary/20 p-4 animate-pulse h-24" />)}
                </div>
              ) : dbApiKeys.length === 0 && !showCreateKey ? (
                <div className="text-center py-12">
                  <Key className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <h3 className="font-semibold mb-1">No API keys yet</h3>
                  <p className="text-sm text-muted-foreground">Create your first API key to access AgentFlow programmatically.</p>
                </div>
              ) : (
                dbApiKeys.map(apiKey => (
                  <div key={apiKey.id} className={`rounded-xl border p-4 transition-all ${apiKey.revoked ? "border-red-500/20 bg-red-500/5 opacity-60" : "border-white/5 bg-secondary/20"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{apiKey.name}</h3>
                          {apiKey.revoked && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                              <XCircle className="w-2.5 h-2.5" /> Revoked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">
                            {apiKey.keyPrefix}••••••••••••
                          </code>
                          {revealedKeyHash?.id === apiKey.id && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-emerald-400">SHA-256:</span>
                              <code className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono text-emerald-300 max-w-[200px] truncate" title={revealedKeyHash.hash}>
                                {revealedKeyHash.hash.slice(0, 16)}...{revealedKeyHash.hash.slice(-8)}
                              </code>
                              <button onClick={() => { navigator.clipboard.writeText(revealedKeyHash.hash); toast({ title: "Hash copied!" }); }}>
                                <Copy className="w-3 h-3 text-emerald-400/70 hover:text-emerald-300" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!apiKey.revoked && yubiKeyRegistered && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                            onClick={() => handleYubiKeyAuth(apiKey.id)}
                            disabled={yubiKeyVerifying && revealingKeyId === apiKey.id}
                          >
                            {yubiKeyVerifying && revealingKeyId === apiKey.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Fingerprint className="w-3 h-3 mr-1" />
                            )}
                            {revealedKeyHash?.id === apiKey.id ? "Re-verify" : "Reveal Hash"}
                          </Button>
                        )}
                        {!apiKey.revoked && (
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-400 hover:bg-amber-500/10"
                            onClick={() => handleRevokeApiKey(apiKey.id)}>
                            <Lock className="w-3 h-3 mr-1" /> Revoke
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteApiKey(apiKey.id, apiKey.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                      <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                      <span>Last used: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : "Never"}</span>
                      <div className="flex gap-1">
                        {(apiKey.scopes || []).map((scope: string) => (
                          <span key={scope} className="bg-secondary px-1.5 py-0.5 rounded capitalize">{scope}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Usb className="w-4 h-4 text-purple-400" />
                  YubiKey Management
                </h3>
                <p className="text-xs text-muted-foreground">Registered YubiKeys are required to reveal API key hashes after initial creation. This provides hardware-level security for your credentials.</p>

                {webauthnCreds.length > 0 ? (
                  <div className="space-y-2">
                    {webauthnCreds.map((cred: any) => (
                      <div key={cred.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Fingerprint className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{cred.deviceName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ID: {cred.credentialId?.slice(0, 12)}... · Added {new Date(cred.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteWebauthnCred(cred.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
                    <Fingerprint className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">No YubiKeys registered</p>
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={handleRegisterYubiKey} disabled={registeringYubiKey}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                  {registeringYubiKey ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                  Register New YubiKey
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card/60 p-6 space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  Notification Preferences
                </h2>

                {[
                  { label: "Execution Failures", desc: "Get notified when a workflow execution fails", defaultOn: true },
                  { label: "Evaluation Regressions", desc: "Notify when agent quality scores drop below threshold", defaultOn: true },
                  { label: "New Integrations", desc: "Get notified about new integration availability", defaultOn: false },
                  { label: "Security Alerts", desc: "Critical security events and suspicious activity", defaultOn: true },
                  { label: "Scheduled Reports", desc: "Weekly summary of platform usage and performance", defaultOn: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.defaultOn} />
                  </div>
                ))}

                <Button onClick={handleSave} className="bg-primary text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Notification Settings
                </Button>
              </div>

              <CostAlertsSection />
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card/60 p-6 space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-400" />
                  Advanced Configuration
                </h2>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Durable State Persistence</Label>
                    <p className="text-[10px] text-muted-foreground">Save agent execution state to resume after interruptions (like LangGraph)</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Time Travel Debugging</Label>
                    <p className="text-[10px] text-muted-foreground">Enable execution checkpoints for replaying and rewinding agent runs</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Parallel Execution</Label>
                    <p className="text-[10px] text-muted-foreground">Allow multiple workflow branches to execute concurrently</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Cross-Thread Memory</Label>
                    <p className="text-[10px] text-muted-foreground">Allow agents to access memories across different conversation threads</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Semantic Memory Search</Label>
                    <p className="text-[10px] text-muted-foreground">Find relevant memories based on meaning, not just exact matches</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-1.5">
                  <Label>Max Concurrent Executions</Label>
                  <Input type="number" value={maxConcurrent} onChange={e => setMaxConcurrent(e.target.value)} className="bg-secondary/50 border-white/10 w-24" />
                  <p className="text-[10px] text-muted-foreground">Maximum number of workflows running simultaneously.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Execution Timeout (seconds)</Label>
                  <Input type="number" value={execTimeout} onChange={e => setExecTimeout(e.target.value)} className="bg-secondary/50 border-white/10 w-24" />
                  <p className="text-[10px] text-muted-foreground">Maximum time for a single workflow execution before it's cancelled.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Code Execution Runtime</Label>
                  <Select value={codeRuntime} onValueChange={setCodeRuntime}>
                    <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript only</SelectItem>
                      <SelectItem value="python">Python only</SelectItem>
                      <SelectItem value="both">JavaScript + Python</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Languages available for Code nodes in workflows.</p>
                </div>

                <Button onClick={handleSaveAdvanced} className="bg-primary text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Advanced Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CostAlert {
  id: number;
  name: string;
  budgetAmount: string;
  currentSpend: string;
  alertThreshold: number;
  enabled: boolean;
  alertType: string;
  notifyEmail: boolean;
  notifyInApp: boolean;
  triggered: boolean;
  triggeredAt: string | null;
  resetDay: number;
  createdAt: string;
}

function CostAlertsSection() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("Monthly Budget Alert");
  const [budget, setBudget] = useState("500");
  const [threshold, setThreshold] = useState("80");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cost-alerts`);
      const data = await res.json();
      if (Array.isArray(data)) setAlerts(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const createAlert = async () => {
    if (!name.trim() || !budget) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/cost-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          budgetAmount: budget,
          alertThreshold: Number(threshold),
          notifyEmail,
          notifyInApp,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const alert = await res.json();
      setAlerts(prev => [...prev, alert]);
      setShowForm(false);
      setName("Monthly Budget Alert");
      setBudget("500");
      setThreshold("80");
      toast({ title: "Cost alert created!", description: `You'll be notified at ${threshold}% of $${budget}` });
    } catch {
      toast({ title: "Error creating alert", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleAlert = async (id: number, enabled: boolean) => {
    await fetch(`${API_BASE}/api/cost-alerts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
    toast({ title: enabled ? "Alert enabled" : "Alert disabled" });
  };

  const resetAlert = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/cost-alerts/${id}/reset`, { method: "POST" });
    const updated = await res.json();
    setAlerts(prev => prev.map(a => a.id === id ? updated : a));
    toast({ title: "Spend counter reset" });
  };

  const deleteAlert = async (id: number) => {
    await fetch(`${API_BASE}/api/cost-alerts/${id}`, { method: "DELETE" });
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast({ title: "Cost alert deleted" });
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Cost Alerts
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Set monthly budget alerts to get notified when spending approaches your limit.</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3 h-3" /> New Alert
        </Button>
      </div>

      {showForm && (
        <div className="bg-card/80 border border-white/10 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Alert Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50 border-white/10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Budget ($)</Label>
              <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="bg-secondary/50 border-white/10" min="1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Alert Threshold: {threshold}%</Label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>10%</span>
              <span>Trigger alert at {threshold}% of ${budget} = ${(Number(budget) * Number(threshold) / 100).toFixed(2)}</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={notifyInApp} onCheckedChange={setNotifyInApp} />
              <span>In-App Notification</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
              <span>Email Notification</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={createAlert} disabled={saving || !name.trim() || !budget} className="gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Alert
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 && !showForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No cost alerts configured.</p>
          <p className="text-xs">Create an alert to monitor your spending.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const pct = Number(alert.budgetAmount) > 0 ? (Number(alert.currentSpend) / Number(alert.budgetAmount)) * 100 : 0;
            const barColor = pct >= 90 ? 'bg-red-500' : pct >= Number(alert.alertThreshold) ? 'bg-amber-500' : 'bg-emerald-500';
            const statusColor = pct >= 90 ? 'text-red-400' : pct >= Number(alert.alertThreshold) ? 'text-amber-400' : 'text-emerald-400';

            return (
              <div key={alert.id} className={`rounded-xl border p-4 ${alert.enabled ? 'border-white/10 bg-card/60' : 'border-white/5 bg-card/30 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Switch checked={alert.enabled} onCheckedChange={(v) => toggleAlert(alert.id, v)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{alert.name}</h3>
                      {alert.triggered && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" /> Triggered
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Alert at {alert.alertThreshold}% • {alert.notifyInApp ? "In-app" : ""}{alert.notifyInApp && alert.notifyEmail ? " + " : ""}{alert.notifyEmail ? "Email" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resetAlert(alert.id)} title="Reset spend counter">
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAlert(alert.id)} title="Delete alert">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={statusColor}>
                      ${Number(alert.currentSpend).toFixed(2)} spent
                    </span>
                    <span className="text-muted-foreground">
                      ${Number(alert.budgetAmount).toFixed(2)} budget
                    </span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {pct.toFixed(1)}% used
                    </span>
                    <span>${(Number(alert.budgetAmount) - Number(alert.currentSpend)).toFixed(2)} remaining</span>
                  </div>
                </div>

                {alert.triggered && alert.triggeredAt && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1">
                    <AlertTriangle className="w-3 h-3" />
                    Alert triggered on {new Date(alert.triggeredAt).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
