import { useState } from "react";
import { useListIntegrations, useConnectIntegration, useDisconnectIntegration } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, Plug, Check, ExternalLink, Star, Filter,
  MessageSquare, Mail, Database, Globe, Code2, Brain,
  CreditCard, FileText, Cloud, BarChart3, Shield, Users,
  Calendar, Image, Video, Phone, Boxes, Zap, BookOpen,
  GitBranch, Terminal, Webhook, HardDrive, Layers, X, Key, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "all", label: "All", icon: Boxes },
  { id: "llm", label: "LLM Providers", icon: Brain },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "database", label: "Databases", icon: Database },
  { id: "productivity", label: "Productivity", icon: Calendar },
  { id: "developer", label: "Developer Tools", icon: Code2 },
  { id: "crm", label: "CRM & Sales", icon: Users },
  { id: "storage", label: "Cloud Storage", icon: Cloud },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "payment", label: "Payments", icon: CreditCard },
  { id: "vector", label: "Vector Stores", icon: Layers },
  { id: "media", label: "Media", icon: Image },
];

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [connectModal, setConnectModal] = useState<{ name: string; icon: string } | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: integrations, isLoading } = useListIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();

  const items = integrations || [];
  const filtered = items.filter(i => {
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "all" || i.category === category;
    return matchesSearch && matchesCat;
  });

  const connectedCount = items.filter(i => i.connected).length;
  const totalNodes = items.reduce((sum, i) => sum + (i.nodes || 0), 0);

  const handleConnect = (name: string, icon: string) => {
    setConnectModal({ name, icon });
    setApiKeyInput("");
    setShowApiKey(false);
  };

  const handleSubmitConnect = () => {
    if (!connectModal || !apiKeyInput.trim()) return;
    connectMutation.mutate(
      { data: { name: connectModal.name, apiKey: apiKeyInput } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
          toast({ title: `${connectModal.name} connected successfully!` });
          setConnectModal(null);
          setApiKeyInput("");
        },
        onError: () => { toast({ title: "Failed to connect", variant: "destructive" }); },
      }
    );
  };

  const handleDisconnect = (name: string) => {
    disconnectMutation.mutate(
      { data: { name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
          toast({ title: `${name} disconnected` });
        },
        onError: () => {
          toast({ title: `Failed to disconnect ${name}`, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect your agents to {items.length}+ services, tools, and APIs. {connectedCount} connected.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg font-medium">
            {connectedCount} Connected
          </div>
          <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg font-medium">
            {totalNodes}+ Nodes
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search integrations... (e.g. Slack, OpenAI, PostgreSQL)"
          className="pl-9 bg-secondary/50 border-border"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              category === cat.id
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-xl border border-white/5 bg-secondary/20 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50" />
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded w-24 mb-2" />
                  <div className="h-3 bg-secondary rounded w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(integration => (
            <div
              key={integration.id}
              className={`rounded-xl border p-4 transition-all hover:scale-[1.01] ${
                integration.connected
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-white/5 bg-secondary/20 hover:border-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-xl flex-shrink-0">
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{integration.name}</h3>
                    {integration.popular && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    )}
                    {integration.connected && (
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                        <Check className="w-2.5 h-2.5" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{integration.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {integration.nodes && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Boxes className="w-3 h-3" /> {integration.nodes} nodes
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                      <Filter className="w-3 h-3" /> {integration.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  {integration.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-emerald-500/30 text-emerald-400 hover:border-red-500/30 hover:text-red-400"
                      onClick={() => handleDisconnect(integration.name)}
                      disabled={disconnectMutation.isPending}
                    >
                      <Check className="w-3 h-3 mr-1" /> Active
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-primary/80 hover:bg-primary text-white"
                      onClick={() => handleConnect(integration.name, integration.icon || "")}
                    >
                      <Plug className="w-3 h-3 mr-1" /> Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-1">No integrations found</h3>
          <p className="text-sm text-muted-foreground">Try a different search term or category filter</p>
        </div>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Need a custom integration?</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
          Use the HTTP Request node or Code node in your workflows to connect to any REST API, GraphQL endpoint, or webhook — no pre-built integration needed.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" className="border-white/10">
            <Webhook className="w-4 h-4 mr-2" /> HTTP Request Node
          </Button>
          <Button variant="outline" className="border-white/10">
            <Terminal className="w-4 h-4 mr-2" /> Code Node
          </Button>
        </div>
      </div>

      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConnectModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-xl">
                  {connectModal.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Connect {connectModal.name}</h3>
                  <p className="text-xs text-muted-foreground">Enter your API key to connect</p>
                </div>
              </div>
              <button onClick={() => setConnectModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" /> API Key
                </Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder={`Enter your ${connectModal.name} API key...`}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    className="pr-10 bg-secondary/50"
                    onKeyDown={e => { if (e.key === "Enter") handleSubmitConnect(); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                <p className="text-xs text-amber-400/80">
                  Your API key is stored securely and only used for authenticating requests to {connectModal.name}. You can disconnect at any time.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConnectModal(null)} className="border-white/10">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitConnect}
                  disabled={!apiKeyInput.trim() || connectMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {connectMutation.isPending ? (
                    <><Zap className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                  ) : (
                    <><Plug className="w-4 h-4 mr-2" /> Connect</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
