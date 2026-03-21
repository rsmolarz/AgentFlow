import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Bell, CheckCircle2, XCircle, Hash, Plus,
  Trash2, ToggleLeft, ToggleRight, Loader2, AlertCircle, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface SlackChannel {
  id: string;
  name: string;
  events: string[];
  enabled: boolean;
}

export default function SlackConfig() {
  const [connected, setConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channels, setChannels] = useState<SlackChannel[]>([
    { id: "1", name: "agent-alerts", events: ["execution.failed", "cost.alert"], enabled: true },
    { id: "2", name: "workflow-updates", events: ["workflow.completed", "workflow.failed"], enabled: true },
    { id: "3", name: "general", events: ["agent.created", "agent.deleted"], enabled: false },
  ]);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const eventOptions = [
    { value: "execution.completed", label: "Execution Completed", icon: CheckCircle2, color: "text-emerald-400" },
    { value: "execution.failed", label: "Execution Failed", icon: XCircle, color: "text-red-400" },
    { value: "cost.alert", label: "Cost Alert Triggered", icon: AlertCircle, color: "text-amber-400" },
    { value: "workflow.completed", label: "Workflow Completed", icon: Zap, color: "text-blue-400" },
    { value: "workflow.failed", label: "Workflow Failed", icon: XCircle, color: "text-red-400" },
    { value: "agent.created", label: "Agent Created", icon: Plus, color: "text-emerald-400" },
    { value: "agent.deleted", label: "Agent Deleted", icon: Trash2, color: "text-red-400" },
    { value: "eval.completed", label: "Evaluation Completed", icon: CheckCircle2, color: "text-violet-400" },
  ];

  function handleConnect() {
    if (!webhookUrl.trim()) return;
    setConnecting(true);
    setTimeout(() => {
      setConnected(true);
      setConnecting(false);
      toast({ title: "Slack Connected", description: "Webhook URL configured successfully." });
    }, 1500);
  }

  function toggleChannel(id: string) {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Slack Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure Slack webhooks to receive real-time alerts about agent activity.
          </p>
        </div>
        <Badge variant={connected ? "default" : "secondary"} className="gap-1.5 text-sm px-3 py-1">
          {connected ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {connected ? "Connected" : "Not Connected"}
        </Badge>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Slack Webhook Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create an Incoming Webhook in your Slack workspace and paste the URL here.
        </p>
        <div className="flex gap-3">
          <Input placeholder="https://hooks.slack.com/services/T.../B.../..." value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)} className="flex-1 bg-background border-border/50"
            disabled={connected} />
          {connected ? (
            <Button variant="outline" onClick={() => { setConnected(false); setWebhookUrl(""); }}
              className="border-border/50">
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={connecting || !webhookUrl.trim()} className="gap-2">
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Notification Channels</h3>
        {channels.map(channel => (
          <div key={channel.id} className={`bg-card border rounded-xl p-5 transition-all ${
            channel.enabled ? "border-border/50" : "border-border/30 opacity-60"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">#{channel.name}</span>
                <Badge variant="outline" className="text-xs border-border/50">
                  {channel.events.length} events
                </Badge>
              </div>
              <button onClick={() => toggleChannel(channel.id)}>
                {channel.enabled ?
                  <ToggleRight className="w-8 h-8 text-emerald-400" /> :
                  <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {channel.events.map(event => {
                const opt = eventOptions.find(e => e.value === event);
                const Icon = opt?.icon || Bell;
                return (
                  <Badge key={event} variant="outline" className={`gap-1 text-xs border-border/50 ${opt?.color || ""}`}>
                    <Icon className="w-3 h-3" /> {opt?.label || event}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Available Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {eventOptions.map(evt => {
            const Icon = evt.icon;
            return (
              <div key={evt.value} className="bg-card border border-border/50 rounded-xl p-3 flex items-center gap-3">
                <Icon className={`w-4 h-4 ${evt.color}`} />
                <span className="text-sm text-foreground">{evt.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
