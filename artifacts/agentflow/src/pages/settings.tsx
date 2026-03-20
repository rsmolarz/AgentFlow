import { useState } from "react";
import { 
  Settings as SettingsIcon, Key, Shield, Server, Globe, Brain, Save, Plus, Trash2, Copy,
  Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw, ExternalLink, Lock, Info, HelpCircle,
  Webhook, Cpu, Layers, Users, Bell, Palette, Code2, Terminal
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

interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  scopes: string[];
}

const INITIAL_API_KEYS: ApiKeyEntry[] = [
  { id: "key-1", name: "Production API Key", key: "af_prod_sk_a1b2c3d4e5f6g7h8", created: "2026-01-15", lastUsed: "2026-03-20", scopes: ["read", "write", "execute"] },
  { id: "key-2", name: "Development Key", key: "af_dev_sk_x9y8z7w6v5u4t3s2", created: "2026-02-20", lastUsed: "2026-03-19", scopes: ["read", "write"] },
  { id: "key-3", name: "Webhook Integration", key: "af_wh_sk_m1n2o3p4q5r6s7t8", created: "2026-03-01", lastUsed: "2026-03-18", scopes: ["execute"] },
];

function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "af_sk_";
  for (let i = 0; i < 32; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>(INITIAL_API_KEYS);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);

  const handleSave = () => {
    toast({ title: "Settings saved successfully!" });
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
                  <Input defaultValue="AgentFlow" className="bg-secondary/50 border-white/10" />
                </div>

                <div className="space-y-1.5">
                  <Label>Default LLM Provider</Label>
                  <Select defaultValue="openai">
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
                  <Select defaultValue="gpt-4o">
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
                  <Switch defaultChecked />
                </div>

                <div className="space-y-1.5">
                  <Label>Monthly Token Budget</Label>
                  <Input type="number" defaultValue="1000000" className="bg-secondary/50 border-white/10" />
                  <p className="text-[10px] text-muted-foreground">Maximum tokens across all agents per month. Agent runs will be paused when limit is reached.</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Streaming Responses</Label>
                    <p className="text-[10px] text-muted-foreground">Enable token-by-token streaming for real-time agent output</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label>Execution Logging</Label>
                    <p className="text-[10px] text-muted-foreground">Log all inputs, outputs, and intermediate steps for debugging</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button onClick={handleSave} className="bg-primary text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
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
                  <p className="text-sm text-muted-foreground">Manage API keys for external access to AgentFlow.</p>
                </div>
                <Button className="bg-primary text-white" size="sm" onClick={() => { setShowCreateKey(true); setNewKeyName(""); setNewKeyScopes(["read"]); setJustCreatedKey(null); }}>
                  <Plus className="w-4 h-4 mr-1" /> Create Key
                </Button>
              </div>

              {showCreateKey && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    {justCreatedKey ? "Key Created Successfully" : "Create New API Key"}
                  </h3>

                  {justCreatedKey ? (
                    <div className="space-y-3">
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-xs text-amber-300 flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Copy this key now. You won't be able to see it again.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-black/30 px-3 py-1.5 rounded font-mono flex-1 select-all break-all">
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
                        <Input placeholder="e.g. My Integration Key" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
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
                        <Button
                          size="sm"
                          disabled={!newKeyName.trim() || newKeyScopes.length === 0}
                          onClick={() => {
                            const newKey = generateApiKey();
                            const today = new Date().toISOString().split("T")[0];
                            const entry: ApiKeyEntry = {
                              id: `key-${Date.now()}`,
                              name: newKeyName.trim(),
                              key: newKey,
                              created: today,
                              lastUsed: "Never",
                              scopes: [...newKeyScopes],
                            };
                            setApiKeys(prev => [...prev, entry]);
                            setJustCreatedKey(newKey);
                            toast({ title: `API key "${newKeyName}" created!` });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Generate Key
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCreateKey(false)}>Cancel</Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {apiKeys.map(apiKey => (
                <div key={apiKey.id} className="rounded-xl border border-white/5 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{apiKey.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">
                          {showApiKey === apiKey.id ? apiKey.key : apiKey.key.slice(0, 6) + "••••••••"}
                        </code>
                        <button onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}>
                          {showApiKey === apiKey.id ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(apiKey.key); toast({ title: "API key copied!" }); }}>
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Delete API key "${apiKey.name}"?`)) {
                          setApiKeys(prev => prev.filter(k => k.id !== apiKey.id));
                          toast({ title: `API key "${apiKey.name}" deleted.` });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                    <span>Created: {apiKey.created}</span>
                    <span>Last used: {apiKey.lastUsed}</span>
                    <div className="flex gap-1">
                      {apiKey.scopes.map(scope => (
                        <span key={scope} className="bg-secondary px-1.5 py-0.5 rounded capitalize">{scope}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="rounded-xl border border-border bg-card/60 p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                Notification Preferences
              </h2>

              {[
                { label: "Execution Failures", desc: "Get notified when a workflow execution fails", defaultOn: true },
                { label: "Budget Alerts", desc: "Alert when token usage approaches monthly budget", defaultOn: true },
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
                  <Input type="number" defaultValue="10" className="bg-secondary/50 border-white/10 w-24" />
                  <p className="text-[10px] text-muted-foreground">Maximum number of workflows running simultaneously.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Execution Timeout (seconds)</Label>
                  <Input type="number" defaultValue="300" className="bg-secondary/50 border-white/10 w-24" />
                  <p className="text-[10px] text-muted-foreground">Maximum time for a single workflow execution before it's cancelled.</p>
                </div>

                <div className="space-y-1.5">
                  <Label>Code Execution Runtime</Label>
                  <Select defaultValue="both">
                    <SelectTrigger className="bg-secondary/50 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript only</SelectItem>
                      <SelectItem value="python">Python only</SelectItem>
                      <SelectItem value="both">JavaScript + Python</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Languages available for Code nodes in workflows.</p>
                </div>

                <Button onClick={handleSave} className="bg-primary text-white">
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
