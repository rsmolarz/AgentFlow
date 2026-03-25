import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  ReactFlowProvider,
  Handle,
  Position,
  Panel
} from '@xyflow/react';
import { 
  useGetWorkflow, 
  useUpdateWorkflow, 
  useRunWorkflow,
  useListAgents 
} from "@workspace/api-client-react";
import { 
  Play, Save, ChevronLeft, Bot, Zap, Filter, FileOutput, Code2, ShieldAlert, 
  Sparkles, ArrowRightLeft, X, HelpCircle, Settings2, Clock, Webhook,
  RotateCcw, GitBranch, AlertTriangle, CheckCircle2, Trash2, Copy,
  Info, ChevronDown, ChevronRight, Timer, RefreshCw, MessageSquare,
  Layers, Globe, Database, BookOpen, History, RotateCw, Loader2,
  FileJson, Eye
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const nodeDescriptions: Record<string, { title: string; desc: string; help: string }> = {
  trigger: {
    title: "Trigger",
    desc: "The starting point of your workflow",
    help: "Every workflow starts with a trigger. Choose what kicks off your pipeline: a manual button click, a scheduled timer (like every hour), or an incoming webhook from another app. Think of it as the 'when' of your automation."
  },
  agent: {
    title: "AI Agent",
    desc: "An autonomous AI worker that processes data",
    help: "An Agent node connects one of your configured AI agents to the workflow. The agent receives data from the previous step, processes it using its system prompt and tools, then passes the result to the next step. Select which agent to use from the dropdown below."
  },
  condition: {
    title: "Condition (If/Else)",
    desc: "Branch your workflow based on rules",
    help: "A Condition node lets you create 'if this, then that' logic. For example: 'If the sentiment is positive, go to Step A. Otherwise, go to Step B.' The 'Pass' output goes right when the condition is true, and 'Fail' goes left when it's false."
  },
  output: {
    title: "Output",
    desc: "Send results to a destination",
    help: "The Output node is where your workflow delivers its final result. This could be sending an email, saving to a database, posting to Slack, or returning data to the user. Every workflow should end with at least one output node."
  },
  code: {
    title: "Code / Script",
    desc: "Run custom JavaScript code",
    help: "The Code node lets you write custom JavaScript to transform data however you need. The input from the previous step is available as 'input'. Return your result and it will be passed to the next step. Great for data formatting, calculations, or custom logic."
  },
  llm_call: {
    title: "LLM Call",
    desc: "Make a direct call to a language model",
    help: "Unlike an Agent (which has tools and memory), an LLM Call is a simple, direct request to a language model. Write a prompt, optionally use a template with variables from previous steps, and get back the model's response. Perfect for summarization, classification, or text generation."
  },
  transform: {
    title: "Transform",
    desc: "Reshape and map data between steps",
    help: "The Transform node lets you restructure data between steps. Map fields from the input to new field names, filter out unwanted data, merge multiple fields, or convert formats. No coding required — just configure the field mappings below."
  },
  error_handler: {
    title: "Error Handler",
    desc: "Catch and handle errors gracefully",
    help: "The Error Handler node catches any errors that occur in connected nodes. Instead of your workflow failing silently, you can log the error, send a notification, retry the failed step, or run a fallback action. Always add error handling to production workflows."
  },
  delay: {
    title: "Delay / Wait",
    desc: "Pause the workflow for a set time",
    help: "The Delay node pauses your workflow for a specified amount of time before continuing to the next step. Useful for rate limiting API calls, waiting for external processes to complete, or spacing out notifications."
  },
  loop: {
    title: "Loop / Iterator",
    desc: "Process items one at a time from a list",
    help: "The Loop node takes a list of items and processes each one individually through the connected steps. For example, if you have a list of 10 customer emails, the loop will process each email one by one through the downstream nodes."
  },
  human_review: {
    title: "Human Review",
    desc: "Pause and wait for human approval",
    help: "The Human Review node pauses the workflow and notifies a person to review the current data. The workflow only continues after someone approves or rejects the step. Essential for sensitive operations like publishing content or sending bulk emails."
  },
  merge: {
    title: "Merge / Join",
    desc: "Combine data from multiple branches",
    help: "The Merge node collects outputs from two or more parallel branches and combines them into a single dataset. Use this after a condition node to rejoin split paths, or to aggregate results from parallel processing."
  },
  parallel: {
    title: "Parallel Execution",
    desc: "Run multiple branches simultaneously",
    help: "The Parallel node splits workflow execution into multiple branches that run at the same time. Each branch processes independently and results are collected by a downstream Merge node. Great for speeding up workflows where steps don't depend on each other."
  },
  webhook: {
    title: "Webhook",
    desc: "Listen for incoming HTTP requests",
    help: "The Webhook node creates an endpoint that listens for external HTTP requests (POST, GET, etc.). When a request arrives, it triggers the downstream workflow with the request data. Useful for receiving events from third-party services, payment callbacks, or form submissions."
  },
  api_call: {
    title: "API Request",
    desc: "Make HTTP requests to external APIs",
    help: "The API Request node sends HTTP requests to any REST API endpoint. Configure the method (GET, POST, PUT, DELETE), URL, headers, and body. Supports authentication, query parameters, and response parsing. Perfect for connecting to any service without a pre-built integration."
  },
  knowledge_query: {
    title: "Knowledge Query",
    desc: "Search your knowledge bases using RAG",
    help: "The Knowledge Query node performs a semantic search against your configured knowledge bases. It embeds the query, retrieves the most relevant document chunks, and passes them as context to downstream nodes. Essential for building RAG (Retrieval-Augmented Generation) pipelines."
  },
  output_formatter: {
    title: "Output Formatter",
    desc: "Format data as JSON, CSV, or Markdown",
    help: "The Output Formatter transforms incoming data into a specific format. Choose JSON for structured API responses, CSV for spreadsheet-compatible tabular data, or Markdown for human-readable reports. Configure field selection, custom templates, and formatting options. Use the live preview to see exactly how your output will look before running the workflow."
  },
  localShell: {
    title: "Local Shell",
    desc: "Run a shell command on a connected Mac",
    help: "The Local Shell node executes a command on a connected local Mac via the AgentFlow Bridge. Select a registered machine, enter a shell command (supports {{variable}} interpolation), and configure working directory and timeout. Output streams in real time. Requires the Bridge app running on the target Mac."
  }
};

const nodeConfig: Record<string, { icon: any; color: string; border: string }> = {
  trigger: { icon: Zap, color: "bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/30" },
  agent: { icon: Bot, color: "bg-blue-500/10 text-blue-400", border: "border-blue-500/30" },
  condition: { icon: Filter, color: "bg-amber-500/10 text-amber-400", border: "border-amber-500/30" },
  output: { icon: FileOutput, color: "bg-purple-500/10 text-purple-400", border: "border-purple-500/30" },
  code: { icon: Code2, color: "bg-slate-500/10 text-slate-400", border: "border-slate-500/30" },
  llm_call: { icon: Sparkles, color: "bg-pink-500/10 text-pink-400", border: "border-pink-500/30" },
  transform: { icon: ArrowRightLeft, color: "bg-cyan-500/10 text-cyan-400", border: "border-cyan-500/30" },
  error_handler: { icon: AlertTriangle, color: "bg-red-500/10 text-red-400", border: "border-red-500/30" },
  delay: { icon: Timer, color: "bg-orange-500/10 text-orange-400", border: "border-orange-500/30" },
  loop: { icon: RefreshCw, color: "bg-violet-500/10 text-violet-400", border: "border-violet-500/30" },
  human_review: { icon: MessageSquare, color: "bg-yellow-500/10 text-yellow-400", border: "border-yellow-500/30" },
  merge: { icon: GitBranch, color: "bg-teal-500/10 text-teal-400", border: "border-teal-500/30" },
  parallel: { icon: Layers, color: "bg-indigo-500/10 text-indigo-400", border: "border-indigo-500/30" },
  webhook: { icon: Globe, color: "bg-rose-500/10 text-rose-400", border: "border-rose-500/30" },
  api_call: { icon: Globe, color: "bg-sky-500/10 text-sky-400", border: "border-sky-500/30" },
  knowledge_query: { icon: BookOpen, color: "bg-lime-500/10 text-lime-400", border: "border-lime-500/30" },
  output_formatter: { icon: FileJson, color: "bg-fuchsia-500/10 text-fuchsia-400", border: "border-fuchsia-500/30" },
  localShell: { icon: Terminal, color: "bg-violet-500/10 text-violet-400", border: "border-violet-500/30" },
  default: { icon: ShieldAlert, color: "bg-secondary text-foreground", border: "border-border" }
};

const CustomNode = ({ data, type, isConnectable, selected }: any) => {
  const config = nodeConfig[type] || nodeConfig.default;
  const Icon = config.icon;

  return (
    <div className={`xyflow-custom-node border ${config.border} ${selected ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(124,58,237,0.3)]' : ''} shadow-lg hover:shadow-xl transition-all`}>
      {type !== 'trigger' && (
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-card border-2 border-primary" />
      )}
      <div className={`xyflow-custom-node-header ${config.color.split(' ')[0]}`}>
        <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
        <strong className="text-foreground">{data.label || nodeDescriptions[type]?.title || type}</strong>
      </div>
      <div className="xyflow-custom-node-body text-xs text-muted-foreground">
        {data.description || nodeDescriptions[type]?.desc || `Execute ${type} task`}
        {type !== 'trigger' && data.retryEnabled && (
          <div className="mt-1.5 flex items-center gap-1 text-amber-400">
            <RotateCcw className="w-3 h-3" />
            <span className="text-[10px]">Retry ×{data.retryMaxAttempts || 3}</span>
          </div>
        )}
        {data.agentName && <div className="mt-2 text-primary font-medium">{data.agentName}</div>}
        {data.triggerType && (
          <div className="mt-2 flex items-center gap-1 text-emerald-400">
            {data.triggerType === 'webhook' && <Webhook className="w-3 h-3" />}
            {data.triggerType === 'schedule' && <Clock className="w-3 h-3" />}
            {data.triggerType === 'manual' && <Play className="w-3 h-3" />}
            <span className="capitalize">{data.triggerType}</span>
          </div>
        )}
      </div>
      {type === 'condition' ? (
        <>
          <Handle type="source" position={Position.Bottom} id="pass" isConnectable={isConnectable} className="w-3 h-3 bg-card border-2 border-emerald-500" style={{ left: '30%' }} />
          <Handle type="source" position={Position.Bottom} id="fail" isConnectable={isConnectable} className="w-3 h-3 bg-card border-2 border-red-500" style={{ left: '70%' }} />
          <div className="flex justify-between px-3 -mb-1 text-[9px]">
            <span className="text-emerald-400">Pass</span>
            <span className="text-red-400">Fail</span>
          </div>
        </>
      ) : type !== 'output' ? (
        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-card border-2 border-primary" />
      ) : null}
    </div>
  );
};

const nodeTypes = Object.fromEntries(
  Object.keys(nodeConfig).filter(k => k !== 'default').map(k => [k, CustomNode])
);

const CRON_PRESETS = [
  { label: "Every 5 min", cron: "*/5 * * * *", icon: "5m" },
  { label: "Every 15 min", cron: "*/15 * * * *", icon: "15m" },
  { label: "Every hour", cron: "0 * * * *", icon: "1h" },
  { label: "Every 6 hours", cron: "0 */6 * * *", icon: "6h" },
  { label: "Daily at 9 AM", cron: "0 9 * * *", icon: "9am" },
  { label: "Daily at midnight", cron: "0 0 * * *", icon: "12am" },
  { label: "Weekdays 9 AM", cron: "0 9 * * 1-5", icon: "M-F" },
  { label: "Weekly Monday", cron: "0 0 * * 1", icon: "Mon" },
  { label: "Monthly 1st", cron: "0 0 1 * *", icon: "1st" },
];

function ScheduleTriggerConfig({ localData, update, workflowId }: { localData: any; update: (key: string, value: any) => void; workflowId?: number }) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (workflowId) {
      fetch(`${API_BASE}/api/workflows/${workflowId}/schedules`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setSchedules(data); })
        .catch(() => {});
    }
  }, [workflowId]);

  const saveSchedule = async () => {
    if (!workflowId || !localData.schedule) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/workflows/${workflowId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cronExpression: localData.schedule,
          timezone: localData.scheduleTimezone || "UTC",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      const schedule = await res.json();
      setSchedules(prev => [...prev, schedule]);
      toast({ title: "Schedule saved!", description: `Next run: ${new Date(schedule.nextRunAt).toLocaleString()}` });
    } catch (err: any) {
      toast({ title: "Error saving schedule", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async (id: number, enabled: boolean) => {
    try {
      await fetch(`${API_BASE}/api/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
    } catch {}
  };

  const deleteSchedule = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/schedules/${id}`, { method: "DELETE" });
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast({ title: "Schedule removed" });
    } catch {}
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Quick Presets</Label>
        <div className="grid grid-cols-3 gap-1">
          {CRON_PRESETS.map(preset => (
            <button
              key={preset.cron}
              onClick={() => update('schedule', preset.cron)}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[10px] transition-all ${
                localData.schedule === preset.cron
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 bg-secondary/30 text-muted-foreground hover:border-white/20'
              }`}
            >
              <span className="font-mono font-bold text-xs">{preset.icon}</span>
              <span className="truncate w-full text-center">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Cron Expression</Label>
        <Input
          value={localData.schedule || ''}
          onChange={e => update('schedule', e.target.value)}
          placeholder="*/5 * * * *"
          className="bg-secondary/50 border-white/10 h-8 text-sm font-mono"
        />
        <p className="text-[10px] text-muted-foreground">
          Format: <code className="bg-secondary px-1 rounded">min hour day month weekday</code>
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Timezone</Label>
        <Select value={localData.scheduleTimezone || 'UTC'} onValueChange={v => update('scheduleTimezone', v)}>
          <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
            <SelectItem value="America/Chicago">Central (CT)</SelectItem>
            <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
            <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
            <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
            <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {localData.schedule && workflowId && (
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={saveSchedule}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Clock className="w-3 h-3 mr-1" />}
          Save Schedule
        </Button>
      )}

      {schedules.length > 0 && (
        <div className="border-t border-white/5 pt-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Active Schedules ({schedules.filter(s => s.enabled).length})
          </p>
          <div className="space-y-1.5">
            {schedules.map(s => (
              <div key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${s.enabled ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-secondary/20 opacity-60'}`}>
                <Switch checked={s.enabled} onCheckedChange={v => toggleSchedule(s.id, v)} className="scale-75" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] truncate">{s.cronExpression}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label || s.cronExpression}</p>
                  {s.nextRunAt && <p className="text-[9px] text-emerald-400/70">Next: {new Date(s.nextRunAt).toLocaleString()}</p>}
                </div>
                <button onClick={() => deleteSchedule(s.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function generateFormatterPreview(format: string, localData: any): string {
  const sampleData = {
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Developer",
    score: 95,
    status: "active",
    tags: ["ai", "automation", "agents"],
    created: "2026-03-21T10:30:00Z"
  };

  const fields = (localData.formatterFields || '').split(',').map((f: string) => f.trim()).filter(Boolean);
  const selectedFields = fields.length > 0 ? fields : Object.keys(sampleData);
  const filteredData: Record<string, any> = {};
  selectedFields.forEach((f: string) => {
    if (f in sampleData) filteredData[f] = (sampleData as any)[f];
    else filteredData[f] = `{{${f}}}`;
  });

  if (format === 'json') {
    const indent = localData.jsonIndent || 2;
    const wrapper = localData.jsonWrapper || 'object';
    let dataToFormat = filteredData;
    if (localData.jsonSortKeys) {
      const sorted: Record<string, any> = {};
      Object.keys(dataToFormat).sort().forEach(k => { sorted[k] = dataToFormat[k]; });
      dataToFormat = sorted;
    }
    if (wrapper === 'array') return JSON.stringify([dataToFormat], null, indent);
    if (wrapper === 'envelope') return JSON.stringify({ success: true, data: dataToFormat, timestamp: new Date().toISOString() }, null, indent);
    return JSON.stringify(dataToFormat, null, indent);
  }

  if (format === 'csv') {
    const delimiter = localData.csvDelimiter || ',';
    const quoteAll = localData.csvQuoteAll || false;
    const headers = selectedFields;
    const fmt = (v: any) => {
      const s = Array.isArray(v) ? v.join('; ') : String(v);
      return quoteAll || s.includes(delimiter) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headerRow = headers.map(h => quoteAll ? `"${h}"` : h).join(delimiter);
    const dataRow = headers.map(h => fmt(filteredData[h] ?? '')).join(delimiter);
    if (localData.csvHeaders === false) return dataRow;
    return `${headerRow}\n${dataRow}`;
  }

  if (format === 'markdown') {
    const mdStyle = localData.markdownStyle || 'table';
    if (mdStyle === 'table') {
      const headers = selectedFields;
      const headerRow = `| ${headers.join(' | ')} |`;
      const sepRow = `| ${headers.map(() => '---').join(' | ')} |`;
      const dataRow = `| ${headers.map(h => {
        const v = filteredData[h];
        return Array.isArray(v) ? v.join(', ') : String(v ?? '');
      }).join(' | ')} |`;
      return `${headerRow}\n${sepRow}\n${dataRow}`;
    }
    if (mdStyle === 'list') {
      return selectedFields.map(f => `- **${f}**: ${Array.isArray(filteredData[f]) ? filteredData[f].join(', ') : filteredData[f] ?? ''}`).join('\n');
    }
    if (mdStyle === 'heading') {
      return selectedFields.map(f => `## ${f}\n${Array.isArray(filteredData[f]) ? filteredData[f].join(', ') : filteredData[f] ?? ''}\n`).join('\n');
    }
    if (mdStyle === 'custom') {
      let tmpl = localData.markdownTemplate || '# Report\n\n{{#each fields}}\n- **{{key}}**: {{value}}\n{{/each}}';
      selectedFields.forEach(f => {
        const v = Array.isArray(filteredData[f]) ? filteredData[f].join(', ') : String(filteredData[f] ?? '');
        tmpl = tmpl.replace(new RegExp(`\\{\\{${f}\\}\\}`, 'g'), v);
      });
      return tmpl;
    }
    return selectedFields.map(f => `- **${f}**: ${filteredData[f] ?? ''}`).join('\n');
  }

  return JSON.stringify(filteredData, null, 2);
}

function OutputFormatterConfig({ localData, update }: { localData: any; update: (key: string, value: any) => void }) {
  const format = localData.formatterFormat || 'json';
  const [showPreview, setShowPreview] = useState(true);
  const preview = generateFormatterPreview(format, localData);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          Output Format
          <span className="text-blue-400 cursor-help" title="Choose how the incoming data should be formatted"><Info className="w-3 h-3" /></span>
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'json', label: 'JSON', icon: '{ }' },
            { value: 'csv', label: 'CSV', icon: ',' },
            { value: 'markdown', label: 'Markdown', icon: 'MD' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => update('formatterFormat', opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                format === opt.value
                  ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400'
                  : 'border-white/10 bg-secondary/30 text-muted-foreground hover:border-white/20'
              }`}
            >
              <span className="text-sm font-mono font-bold">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Fields to Include</Label>
        <Input
          value={localData.formatterFields || ''}
          onChange={e => update('formatterFields', e.target.value)}
          placeholder="name, email, score (leave empty for all)"
          className="bg-secondary/50 border-white/10 h-8 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">Comma-separated field names. Leave empty to include all fields from the input data.</p>
      </div>

      {format === 'json' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">JSON Structure</Label>
            <Select value={localData.jsonWrapper || 'object'} onValueChange={v => update('jsonWrapper', v)}>
              <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="object">Plain Object</SelectItem>
                <SelectItem value="array">Wrap in Array</SelectItem>
                <SelectItem value="envelope">API Envelope (success + data + timestamp)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Indentation</Label>
            <Select value={String(localData.jsonIndent || 2)} onValueChange={v => update('jsonIndent', Number(v))}>
              <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Minified (no whitespace)</SelectItem>
                <SelectItem value="2">2 spaces (standard)</SelectItem>
                <SelectItem value="4">4 spaces (expanded)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
            <Label className="text-xs">Sort keys alphabetically</Label>
            <Switch checked={localData.jsonSortKeys || false} onCheckedChange={v => update('jsonSortKeys', v)} />
          </div>
        </>
      )}

      {format === 'csv' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Delimiter</Label>
            <Select value={localData.csvDelimiter || ','} onValueChange={v => update('csvDelimiter', v)}>
              <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value=",">Comma (,)</SelectItem>
                <SelectItem value=";">Semicolon (;)</SelectItem>
                <SelectItem value="\t">Tab</SelectItem>
                <SelectItem value="|">Pipe (|)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
            <div>
              <Label className="text-xs">Include Header Row</Label>
              <p className="text-[10px] text-muted-foreground">Column names as first row</p>
            </div>
            <Switch checked={localData.csvHeaders !== false} onCheckedChange={v => update('csvHeaders', v)} />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
            <div>
              <Label className="text-xs">Quote All Fields</Label>
              <p className="text-[10px] text-muted-foreground">Wrap every value in quotes</p>
            </div>
            <Switch checked={localData.csvQuoteAll || false} onCheckedChange={v => update('csvQuoteAll', v)} />
          </div>
        </>
      )}

      {format === 'markdown' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Markdown Style</Label>
            <Select value={localData.markdownStyle || 'table'} onValueChange={v => update('markdownStyle', v)}>
              <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="list">Bullet List</SelectItem>
                <SelectItem value="heading">Headings with Content</SelectItem>
                <SelectItem value="custom">Custom Template</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {localData.markdownStyle === 'custom' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Custom Template</Label>
              <Textarea
                value={localData.markdownTemplate || '# Report\n\n- **Name**: {{name}}\n- **Email**: {{email}}\n- **Score**: {{score}}'}
                onChange={e => update('markdownTemplate', e.target.value)}
                className="bg-secondary/50 border-white/10 text-sm resize-none font-mono"
                rows={5}
              />
              <p className="text-[10px] text-muted-foreground">Use {'{{fieldName}}'} to insert values from the input data.</p>
            </div>
          )}
        </>
      )}

      <div className="border-t border-white/5 pt-3">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between mb-2"
        >
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Live Preview
          </p>
          {showPreview ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        </button>
        {showPreview && (
          <div className="rounded-lg border border-fuchsia-500/20 bg-black/30 p-3 overflow-x-auto">
            <pre className="text-[11px] text-fuchsia-300/80 font-mono whitespace-pre leading-relaxed max-h-[200px] overflow-y-auto">
              {preview}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeConfigPanel({ node, agents, onUpdate, onClose, onDelete, workflowId }: { 
  node: any; agents: any[]; onUpdate: (id: string, data: any) => void; onClose: () => void; onDelete: (id: string) => void; workflowId?: number;
}) {
  const type = node.type || 'default';
  const info = nodeDescriptions[type] || nodeDescriptions.trigger;
  const config = nodeConfig[type] || nodeConfig.default;
  const Icon = config.icon;
  const [localData, setLocalData] = useState(node.data || {});
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => { setLocalData(node.data || {}); setShowHelp(false); }, [node.id]);

  const update = (key: string, value: any) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onUpdate(node.id, newData);
  };

  return (
    <aside className="w-80 border-l border-white/5 bg-card/60 backdrop-blur-xl flex flex-col z-20 shadow-2xl animate-in slide-in-from-right-5 duration-200">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${config.color.split(' ')[0]} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{info.title}</h3>
            <p className="text-[10px] text-muted-foreground">{info.desc}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <button 
        onClick={() => setShowHelp(!showHelp)} 
        className="mx-4 mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors text-left"
      >
        <HelpCircle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{showHelp ? 'Hide instructions' : 'How does this node work?'}</span>
        {showHelp ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {showHelp && (
        <div className="mx-4 mt-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-muted-foreground leading-relaxed">
          {info.help}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Display Name</Label>
          <Input
            value={localData.label || ''}
            onChange={e => update('label', e.target.value)}
            placeholder={info.title}
            className="bg-secondary/50 border-white/10 h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            value={localData.description || ''}
            onChange={e => update('description', e.target.value)}
            placeholder="What does this step do?"
            className="bg-secondary/50 border-white/10 text-sm resize-none"
            rows={2}
          />
        </div>

        <div className="border-t border-white/5 pt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            <Settings2 className="w-3 h-3 inline mr-1" />
            Node Settings
          </p>

          {type === 'trigger' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  Trigger Type
                  <span className="text-blue-400 cursor-help" title="Manual = click to run. Schedule = runs automatically. Webhook = triggered by external apps.">
                    <Info className="w-3 h-3" />
                  </span>
                </Label>
                <Select value={localData.triggerType || 'manual'} onValueChange={v => update('triggerType', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (click to run)</SelectItem>
                    <SelectItem value="schedule">Scheduled (timer)</SelectItem>
                    <SelectItem value="webhook">Webhook (external apps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {localData.triggerType === 'schedule' && (
                <ScheduleTriggerConfig localData={localData} update={update} workflowId={workflowId} />
              )}
              {localData.triggerType === 'webhook' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                  <div className="bg-secondary/50 border border-white/10 rounded-md p-2 text-xs font-mono text-muted-foreground break-all">
                    /api/webhooks/trigger/{'{workflow_id}'}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Send a POST request to this URL to trigger the workflow. The request body will be available as input data.</p>
                </div>
              )}
            </div>
          )}

          {type === 'agent' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  Select Agent
                  <span className="text-blue-400 cursor-help" title="Choose which AI agent processes data at this step"><Info className="w-3 h-3" /></span>
                </Label>
                <Select value={localData.agentId?.toString() || ''} onValueChange={v => {
                  const agent = agents?.find(a => a.id.toString() === v);
                  update('agentId', Number(v));
                  if (agent) update('agentName', agent.name);
                }}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue placeholder="Choose an agent..." /></SelectTrigger>
                  <SelectContent>
                    {agents?.map(a => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.name} ({a.model})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!agents?.length && <p className="text-[10px] text-amber-400">No agents created yet. Go to Agents page to create one first.</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Custom Instructions (optional)</Label>
                <Textarea value={localData.instructions || ''} onChange={e => update('instructions', e.target.value)} placeholder="Override the agent's default prompt for this step..." className="bg-secondary/50 border-white/10 text-sm resize-none" rows={3} />
                <p className="text-[10px] text-muted-foreground">Leave empty to use the agent's default system prompt.</p>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                <Label className="text-xs">Include conversation history</Label>
                <Switch checked={localData.includeHistory || false} onCheckedChange={v => update('includeHistory', v)} />
              </div>
            </div>
          )}

          {type === 'condition' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Condition Rule</Label>
                <Select value={localData.conditionType || 'contains'} onValueChange={v => update('conditionType', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Output contains text</SelectItem>
                    <SelectItem value="equals">Output equals value</SelectItem>
                    <SelectItem value="greater_than">Number greater than</SelectItem>
                    <SelectItem value="less_than">Number less than</SelectItem>
                    <SelectItem value="regex">Matches pattern (regex)</SelectItem>
                    <SelectItem value="custom">Custom expression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Comparison Value</Label>
                <Input value={localData.conditionValue || ''} onChange={e => update('conditionValue', e.target.value)} placeholder="e.g. positive, true, 100" className="bg-secondary/50 border-white/10 h-8 text-sm" />
                <p className="text-[10px] text-muted-foreground">If the condition passes, data flows to the green (Pass) output. Otherwise, it goes to the red (Fail) output.</p>
              </div>
            </div>
          )}

          {type === 'code' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">JavaScript Code</Label>
                <Textarea
                  value={localData.code || '// The previous step\'s output is in `input`\n// Return your result:\nreturn { result: input.data }'}
                  onChange={e => update('code', e.target.value)}
                  className="bg-secondary/50 border-white/10 text-sm resize-none font-mono"
                  rows={8}
                />
                <p className="text-[10px] text-muted-foreground">Available variables: <code className="bg-secondary px-1 rounded">input</code> (previous step data), <code className="bg-secondary px-1 rounded">context</code> (workflow context)</p>
              </div>
            </div>
          )}

          {type === 'llm_call' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Model</Label>
                <Select value={localData.model || 'gpt-4o'} onValueChange={v => update('model', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (best quality)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (faster, cheaper)</SelectItem>
                    <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-5-haiku">Claude 3.5 Haiku (fast)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Prompt Template</Label>
                <Textarea value={localData.prompt || ''} onChange={e => update('prompt', e.target.value)} placeholder={'Summarize the following text:\n\n{{input.text}}'} className="bg-secondary/50 border-white/10 text-sm resize-none" rows={5} />
                <p className="text-[10px] text-muted-foreground">Use {'{{input.fieldName}}'} to insert data from the previous step.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                <Input type="number" value={localData.maxTokens || 1000} onChange={e => update('maxTokens', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" />
              </div>
            </div>
          )}

          {type === 'transform' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Transform Type</Label>
                <Select value={localData.transformType || 'map'} onValueChange={v => update('transformType', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="map">Map fields (rename/restructure)</SelectItem>
                    <SelectItem value="filter">Filter items (keep matching)</SelectItem>
                    <SelectItem value="reduce">Reduce (aggregate to single value)</SelectItem>
                    <SelectItem value="template">Text template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expression</Label>
                <Textarea value={localData.expression || ''} onChange={e => update('expression', e.target.value)} placeholder={'{\n  "name": "{{input.first_name}} {{input.last_name}}",\n  "email": "{{input.email}}"\n}'} className="bg-secondary/50 border-white/10 text-sm resize-none font-mono" rows={5} />
              </div>
            </div>
          )}

          {type === 'output' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Output Type</Label>
                <Select value={localData.outputType || 'return'} onValueChange={v => update('outputType', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="return">Return data (API response)</SelectItem>
                    <SelectItem value="email">Send email</SelectItem>
                    <SelectItem value="webhook">Send to webhook URL</SelectItem>
                    <SelectItem value="database">Save to database</SelectItem>
                    <SelectItem value="slack">Post to Slack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {localData.outputType === 'email' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Recipient Email</Label>
                  <Input value={localData.email || ''} onChange={e => update('email', e.target.value)} placeholder="user@example.com" className="bg-secondary/50 border-white/10 h-8 text-sm" />
                </div>
              )}
              {localData.outputType === 'webhook' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                  <Input value={localData.webhookUrl || ''} onChange={e => update('webhookUrl', e.target.value)} placeholder="https://..." className="bg-secondary/50 border-white/10 h-8 text-sm" />
                </div>
              )}
            </div>
          )}

          {type === 'error_handler' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">On Error</Label>
                <Select value={localData.errorAction || 'log'} onValueChange={v => update('errorAction', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="log">Log error and continue</SelectItem>
                    <SelectItem value="retry">Retry failed step</SelectItem>
                    <SelectItem value="fallback">Run fallback action</SelectItem>
                    <SelectItem value="stop">Stop workflow</SelectItem>
                    <SelectItem value="notify">Notify and stop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {localData.errorAction === 'retry' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max Retries</Label>
                  <Input type="number" value={localData.maxRetries || 3} onChange={e => update('maxRetries', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" min={1} max={10} />
                </div>
              )}
            </div>
          )}

          {type === 'delay' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Wait Duration</Label>
                <div className="flex gap-2">
                  <Input type="number" value={localData.delayValue || 5} onChange={e => update('delayValue', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm flex-1" min={1} />
                  <Select value={localData.delayUnit || 'seconds'} onValueChange={v => update('delayUnit', v)}>
                    <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {type === 'loop' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Input Array Field</Label>
                <Input value={localData.arrayField || ''} onChange={e => update('arrayField', e.target.value)} placeholder="e.g. items, results, emails" className="bg-secondary/50 border-white/10 h-8 text-sm" />
                <p className="text-[10px] text-muted-foreground">The field name in the input data that contains the list to iterate over.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Max Iterations</Label>
                <Input type="number" value={localData.maxIterations || 100} onChange={e => update('maxIterations', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" min={1} />
              </div>
            </div>
          )}

          {type === 'human_review' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Review Instructions</Label>
                <Textarea value={localData.reviewInstructions || ''} onChange={e => update('reviewInstructions', e.target.value)} placeholder="Please review the generated content for accuracy..." className="bg-secondary/50 border-white/10 text-sm resize-none" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Timeout (hours)</Label>
                <Input type="number" value={localData.timeout || 24} onChange={e => update('timeout', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" min={1} />
                <p className="text-[10px] text-muted-foreground">Auto-reject if no response within this time.</p>
              </div>
            </div>
          )}

          {type === 'merge' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Merge Strategy</Label>
                <Select value={localData.mergeStrategy || 'combine'} onValueChange={v => update('mergeStrategy', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combine">Combine all inputs into array</SelectItem>
                    <SelectItem value="merge_objects">Merge objects (deep merge)</SelectItem>
                    <SelectItem value="wait_all">Wait for all then pass through</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === 'parallel' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Number of Branches</Label>
                <Input type="number" value={localData.branches || 2} onChange={e => update('branches', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" min={2} max={10} />
                <p className="text-[10px] text-muted-foreground">How many parallel paths to create. Each branch executes independently.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Wait Mode</Label>
                <Select value={localData.waitMode || 'all'} onValueChange={v => update('waitMode', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wait for all branches</SelectItem>
                    <SelectItem value="first">Continue on first completion</SelectItem>
                    <SelectItem value="majority">Wait for majority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Timeout (seconds)</Label>
                <Input type="number" value={localData.parallelTimeout || 30} onChange={e => update('parallelTimeout', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" min={1} />
              </div>
            </div>
          )}

          {type === 'webhook' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">HTTP Method</Label>
                <Select value={localData.webhookMethod || 'POST'} onValueChange={v => update('webhookMethod', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Webhook Path</Label>
                <Input value={localData.webhookPath || ''} onChange={e => update('webhookPath', e.target.value)} placeholder="/api/webhook/my-hook" className="bg-secondary/50 border-white/10 h-8 text-sm font-mono" />
                <p className="text-[10px] text-muted-foreground">The URL path where this webhook will listen for incoming requests.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Authentication</Label>
                <Select value={localData.webhookAuth || 'none'} onValueChange={v => update('webhookAuth', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Authentication</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="hmac">HMAC Signature</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                <div>
                  <Label className="text-xs">Respond Immediately</Label>
                  <p className="text-[10px] text-muted-foreground">Send 200 OK before processing</p>
                </div>
                <Switch checked={localData.respondImmediate || false} onCheckedChange={v => update('respondImmediate', v)} />
              </div>
            </div>
          )}

          {type === 'api_call' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Method</Label>
                <Select value={localData.apiMethod || 'GET'} onValueChange={v => update('apiMethod', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input value={localData.apiUrl || ''} onChange={e => update('apiUrl', e.target.value)} placeholder="https://api.example.com/endpoint" className="bg-secondary/50 border-white/10 h-8 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Headers (JSON)</Label>
                <Textarea value={localData.apiHeaders || ''} onChange={e => update('apiHeaders', e.target.value)} placeholder='{"Authorization": "Bearer {{token}}"}' className="bg-secondary/50 border-white/10 text-sm font-mono resize-none" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Request Body (JSON)</Label>
                <Textarea value={localData.apiBody || ''} onChange={e => update('apiBody', e.target.value)} placeholder='{"key": "value"}' className="bg-secondary/50 border-white/10 text-sm font-mono resize-none" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Response Path</Label>
                <Input value={localData.apiResponsePath || ''} onChange={e => update('apiResponsePath', e.target.value)} placeholder="data.results" className="bg-secondary/50 border-white/10 h-8 text-sm font-mono" />
                <p className="text-[10px] text-muted-foreground">JSON path to extract from the response (e.g. data.items[0].name)</p>
              </div>
            </div>
          )}

          {type === 'knowledge_query' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Knowledge Base</Label>
                <Select value={localData.knowledgeBaseId || ''} onValueChange={v => update('knowledgeBaseId', v)}>
                  <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue placeholder="Select knowledge base" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kb-1">Product Documentation</SelectItem>
                    <SelectItem value="kb-2">Customer Support FAQ</SelectItem>
                    <SelectItem value="kb-3">Internal Wiki</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Query Field</Label>
                <Input value={localData.queryField || ''} onChange={e => update('queryField', e.target.value)} placeholder="e.g. input.question" className="bg-secondary/50 border-white/10 h-8 text-sm font-mono" />
                <p className="text-[10px] text-muted-foreground">The field from the previous step to use as the search query.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Top K Results</Label>
                <Input type="number" value={localData.topK || 5} onChange={e => update('topK', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" min={1} max={20} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Similarity Threshold</Label>
                <Input type="number" value={localData.similarityThreshold || 0.7} onChange={e => update('similarityThreshold', Number(e.target.value))} className="bg-secondary/50 border-white/10 h-8 text-sm" min={0} max={1} step={0.05} />
                <p className="text-[10px] text-muted-foreground">Minimum similarity score (0-1) for retrieved documents. Higher = more relevant but fewer results.</p>
              </div>
            </div>
          )}

          {type === 'output_formatter' && (
            <OutputFormatterConfig localData={localData} update={update} />
          )}
        </div>

        {type !== 'trigger' && (
          <div className="border-t border-white/5 pt-4">
            <button
              onClick={() => update('_retryExpanded', !localData._retryExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />
                Auto-Retry Configuration
              </p>
              {localData.retryEnabled && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 mr-1">ON</span>
              )}
              {localData._retryExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>

            {localData._retryExpanded && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
                  <div>
                    <Label className="text-xs">Enable Auto-Retry</Label>
                    <p className="text-[10px] text-muted-foreground">Automatically retry on failure</p>
                  </div>
                  <Switch checked={localData.retryEnabled || false} onCheckedChange={v => update('retryEnabled', v)} />
                </div>

                {localData.retryEnabled && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        Max Retries
                        <span className="text-blue-400 cursor-help" title="Maximum number of retry attempts before marking this step as failed"><Info className="w-3 h-3" /></span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={localData.retryMaxAttempts || 3}
                          onChange={e => update('retryMaxAttempts', Number(e.target.value))}
                          className="flex-1 accent-primary h-1.5"
                        />
                        <span className="text-sm font-mono w-6 text-center">{localData.retryMaxAttempts || 3}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        Backoff Strategy
                        <span className="text-blue-400 cursor-help" title="How delay between retries increases: Fixed = same delay each time, Linear = delay grows evenly, Exponential = delay doubles each time"><Info className="w-3 h-3" /></span>
                      </Label>
                      <Select value={localData.retryBackoff || 'exponential'} onValueChange={v => update('retryBackoff', v)}>
                        <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed (same delay each retry)</SelectItem>
                          <SelectItem value="linear">Linear (delay increases evenly)</SelectItem>
                          <SelectItem value="exponential">Exponential (delay doubles)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Initial Delay (seconds)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={300}
                        value={localData.retryDelay || 5}
                        onChange={e => update('retryDelay', Number(e.target.value))}
                        className="bg-secondary/50 border-white/10 h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Retry On</Label>
                      <Select value={localData.retryOn || 'any_error'} onValueChange={v => update('retryOn', v)}>
                        <SelectTrigger className="bg-secondary/50 border-white/10 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any_error">Any error</SelectItem>
                          <SelectItem value="timeout">Timeout only</SelectItem>
                          <SelectItem value="rate_limit">Rate limit (429) only</SelectItem>
                          <SelectItem value="server_error">Server errors (5xx) only</SelectItem>
                          <SelectItem value="custom">Custom error codes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {localData.retryOn === 'custom' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Error Codes (comma-separated)</Label>
                        <Input
                          value={localData.retryErrorCodes || ''}
                          onChange={e => update('retryErrorCodes', e.target.value)}
                          placeholder="429, 500, 502, 503"
                          className="bg-secondary/50 border-white/10 h-8 text-sm font-mono"
                        />
                      </div>
                    )}

                    <div className="p-2.5 rounded-lg bg-secondary/30 border border-white/5">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Retry Preview</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: localData.retryMaxAttempts || 3 }, (_, i) => {
                          const base = localData.retryDelay || 5;
                          const strategy = localData.retryBackoff || 'exponential';
                          const delay = strategy === 'fixed' ? base : strategy === 'linear' ? base * (i + 1) : base * Math.pow(2, i);
                          return (
                            <div key={i} className="flex items-center gap-1">
                              {i > 0 && <span className="text-[9px] text-muted-foreground">&rarr;</span>}
                              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">
                                {delay >= 60 ? `${Math.round(delay / 60)}m` : `${delay}s`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1.5">
                        Total max wait: {(() => {
                          const base = localData.retryDelay || 5;
                          const strategy = localData.retryBackoff || 'exponential';
                          const total = Array.from({ length: localData.retryMaxAttempts || 3 }, (_, i) =>
                            strategy === 'fixed' ? base : strategy === 'linear' ? base * (i + 1) : base * Math.pow(2, i)
                          ).reduce((a, b) => a + b, 0);
                          return total >= 60 ? `${Math.round(total / 60)}m ${total % 60}s` : `${total}s`;
                        })()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-white/5 pt-4 space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-secondary/30">
            <div>
              <Label className="text-xs">Continue on Error</Label>
              <p className="text-[10px] text-muted-foreground">Don't stop workflow if this step fails</p>
            </div>
            <Switch checked={localData.continueOnError || false} onCheckedChange={v => update('continueOnError', v)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes (internal)</Label>
            <Textarea value={localData.notes || ''} onChange={e => update('notes', e.target.value)} placeholder="Add private notes about this step..." className="bg-secondary/50 border-white/10 text-sm resize-none" rows={2} />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => onDelete(node.id)}>
          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => {
          const newId = `${node.type}-${Date.now()}`;
          onUpdate(newId, { ...localData, label: (localData.label || info.title) + ' (copy)' });
        }}>
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
        </Button>
      </div>
    </aside>
  );
}

interface WorkflowVersion {
  id: number;
  workflowId: number;
  version: number;
  label: string;
  definition: { nodes: any[]; edges: any[] };
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
}

function VersionHistoryPanel({ workflowId, onRestore, onClose }: {
  workflowId: number;
  onRestore: (def: { nodes: any[]; edges: any[] }) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const BASE = import.meta.env.BASE_URL;
  const [restoring, setRestoring] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const { data: versions, isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: [`/api/workflows/${workflowId}/versions`],
    queryFn: async () => {
      const r = await fetch(`${BASE}api/workflows/${workflowId}/versions`);
      if (!r.ok) throw new Error("Failed to fetch versions");
      return r.json();
    },
  });

  const handleRestore = async (version: WorkflowVersion) => {
    setRestoring(version.id);
    try {
      const r = await fetch(`${BASE}api/workflows/${workflowId}/versions/${version.id}/restore`, { method: "POST" });
      if (!r.ok) throw new Error("Failed to restore");
      const workflow = await r.json();
      onRestore(workflow.definition);
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      toast({ title: `Restored to ${version.label}`, description: `${version.nodeCount} nodes, ${version.edgeCount} edges` });
    } catch (e: any) {
      toast({ title: "Restore failed", description: e.message, variant: "destructive" });
    } finally {
      setRestoring(null);
    }
  };

  const previewVersion = previewId !== null ? versions?.find(v => v.id === previewId) : null;

  return (
    <aside className="w-80 border-l border-white/5 bg-card/40 backdrop-blur-md flex flex-col z-10 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Version History
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      {previewVersion ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button onClick={() => setPreviewId(null)} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <ChevronLeft className="w-3 h-3" /> Back to list
          </button>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="font-medium text-sm">{previewVersion.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(previewVersion.createdAt).toLocaleString()}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>{previewVersion.nodeCount} nodes</span>
              <span>{previewVersion.edgeCount} edges</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Nodes in this version</p>
            {previewVersion.definition.nodes?.length > 0 ? (
              <div className="space-y-1.5">
                {previewVersion.definition.nodes.map((n: any) => (
                  <div key={n.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>{n.data?.label || n.type || "Node"}</span>
                    <span className="text-muted-foreground ml-auto">{n.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Empty workflow</p>
            )}
          </div>
          <Button className="w-full" onClick={() => handleRestore(previewVersion)} disabled={restoring === previewVersion.id}>
            {restoring === previewVersion.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCw className="w-4 h-4 mr-2" />}
            Restore This Version
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : versions && versions.length > 0 ? (
            <div className="space-y-1.5">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-white/5 hover:border-primary/20 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                  onClick={() => setPreviewId(v.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{v.label}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(v); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary hover:underline flex items-center gap-1"
                      disabled={restoring === v.id}
                    >
                      {restoring === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                      Restore
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span>{v.nodeCount} nodes</span>
                    <span>{v.edgeCount} edges</span>
                    <span className="ml-auto">{new Date(v.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No versions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Save your workflow to create the first version snapshot.</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

interface Suggestion {
  category: string;
  title: string;
  description: string;
  impact: string;
  nodeIds: string[];
}

interface SuggestionsData {
  suggestions: Suggestion[];
  overallScore: number;
  summary: string;
  tokensUsed: number;
}

const CATEGORY_CONFIG: Record<string, { color: string; icon: any }> = {
  PERFORMANCE: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Zap },
  RELIABILITY: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: ShieldAlert },
  COST: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  STRUCTURE: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Layers },
  BEST_PRACTICES: { color: "text-teal-400 bg-teal-500/10 border-teal-500/20", icon: CheckCircle2 },
};

function SuggestionsPanel({ workflowId, onClose }: { workflowId: number; onClose: () => void }) {
  const { toast } = useToast();
  const BASE = import.meta.env.BASE_URL;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestionsData | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${BASE}api/workflows/${workflowId}/suggestions`, { method: "POST" });
      if (!r.ok) throw new Error((await r.json()).error || "Failed to analyze");
      const result = await r.json();
      setData(result);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { analyze(); }, []);

  const scoreColor = (data?.overallScore ?? 0) >= 80 ? "text-emerald-400" : (data?.overallScore ?? 0) >= 60 ? "text-amber-400" : "text-red-400";
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const sorted = data?.suggestions?.slice().sort((a, b) => (impactOrder[a.impact as keyof typeof impactOrder] ?? 2) - (impactOrder[b.impact as keyof typeof impactOrder] ?? 2));

  return (
    <aside className="w-80 border-l border-white/5 bg-card/40 backdrop-blur-md flex flex-col z-10 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Suggestions
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing your workflow...</p>
            <p className="text-xs text-muted-foreground mt-1">AI is reviewing node structure, connections, and patterns</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400 opacity-60" />
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={analyze}>Try Again</Button>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-secondary/30 border border-white/5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Workflow Health Score</p>
              <p className={`text-3xl font-bold ${scoreColor}`}>{data.overallScore}<span className="text-lg text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground mt-2">{data.summary}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{sorted?.length || 0} Suggestions</p>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={analyze}>
                <RefreshCw className="w-3 h-3 mr-1" /> Re-analyze
              </Button>
            </div>

            {sorted?.map((s, i) => {
              const cat = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.BEST_PRACTICES;
              const CatIcon = cat.icon;
              return (
                <div key={i} className="rounded-xl border border-white/5 bg-secondary/20 overflow-hidden">
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`p-1 rounded-md border ${cat.color} flex-shrink-0 mt-0.5`}>
                        <CatIcon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{s.title}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            s.impact === "high" ? "bg-red-500/10 text-red-400" :
                            s.impact === "medium" ? "bg-amber-500/10 text-amber-400" :
                            "bg-secondary text-muted-foreground"
                          }`}>
                            {s.impact}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                    {s.nodeIds && s.nodeIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.nodeIds.map((nid) => (
                          <span key={nid} className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] text-muted-foreground font-mono">{nid}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <p className="text-[10px] text-muted-foreground text-center pt-2">
              Used {data.tokensUsed} tokens for analysis
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function EditorCanvas({ id }: { id: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { data: workflow, isLoading } = useGetWorkflow(id);
  const { mutate: updateWorkflow, isPending: isSaving } = useUpdateWorkflow();
  const { mutate: runWorkflow, isPending: isRunning } = useRunWorkflow();
  const { data: agents } = useListAgents();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    if (workflow?.definition) {
      setNodes((workflow.definition.nodes as any) || []);
      setEdges((workflow.definition.edges as any) || []);
    }
  }, [workflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const info = nodeDescriptions[type];
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: info?.title || type.charAt(0).toUpperCase() + type.slice(1) },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
  }, [setNodes]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const handleSave = () => {
    const cleanNodes = nodes.map(n => ({
      ...n,
      data: Object.fromEntries(Object.entries(n.data || {}).filter(([k]) => !k.startsWith('_')))
    }));
    updateWorkflow({
      workflowId: id,
      data: { definition: { nodes: cleanNodes, edges } as any }
    }, {
      onSuccess: () => {
        toast({ title: "Workflow saved!" });
        queryClient.invalidateQueries({ queryKey: [`/api/workflows/${id}/versions`] });
      }
    });
  };

  const handleVersionRestore = (def: { nodes: any[]; edges: any[] }) => {
    setNodes(def.nodes || []);
    setEdges(def.edges || []);
  };

  const handleRun = () => {
    runWorkflow({
      workflowId: id,
      data: { inputData: {} }
    }, {
      onSuccess: () => toast({ title: "Execution started! Check the Executions page for results." })
    });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0A0A0A] text-muted-foreground">Loading builder...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <aside className="w-64 border-r border-white/5 bg-card/40 backdrop-blur-md p-4 flex flex-col z-10 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Node Palette</h3>
          <button onClick={() => setShowGuide(!showGuide)} className="text-blue-400 hover:text-blue-300" title="Getting started guide">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {showGuide && (
          <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-muted-foreground space-y-2">
            <p className="text-blue-400 font-semibold">How to build a workflow:</p>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              <li><strong>Drag nodes</strong> from this palette onto the canvas</li>
              <li><strong>Connect them</strong> by dragging from one node's bottom dot to another's top dot</li>
              <li><strong>Click a node</strong> to open its settings panel on the right</li>
              <li><strong>Configure each step</strong> with the specific settings it needs</li>
              <li>Click <strong>Save</strong> to save your changes, then <strong>Run</strong> to test</li>
            </ol>
            <p className="text-amber-400">Tip: Every workflow needs a Trigger node as the starting point!</p>
          </div>
        )}

        <div className="space-y-2">
          {Object.entries(nodeConfig).filter(([k]) => k !== 'default').map(([type, config]) => {
            const Icon = config.icon;
            const info = nodeDescriptions[type];
            return (
              <div
                key={type}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-secondary/50 cursor-grab hover:bg-secondary hover:border-white/10 transition-colors group"
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', type);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                draggable
                title={info?.help}
              >
                <div className={`w-7 h-7 rounded-lg ${config.color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color.split(' ')[1]}`} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium block">{info?.title || type}</span>
                  <span className="text-[10px] text-muted-foreground block truncate">{info?.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/5">
          <h3 className="font-display font-semibold mb-3 text-xs text-muted-foreground uppercase tracking-wider">Available Agents</h3>
          <p className="text-[10px] text-muted-foreground mb-2">Drag an agent to the canvas to add it as a step</p>
          <div className="space-y-1.5 overflow-y-auto max-h-[200px] pr-1">
            {agents?.map(agent => (
              <div
                key={agent.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-primary/20 bg-background/30 cursor-grab text-xs"
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', 'agent');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                draggable
              >
                <Bot className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="truncate">{agent.name}</span>
                <span className="text-[9px] text-muted-foreground ml-auto">{agent.model}</span>
              </div>
            ))}
            {!agents?.length && (
              <p className="text-[10px] text-muted-foreground py-2">No agents yet. Create one first on the Agents page.</p>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-black/20"
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="hsl(var(--muted-foreground) / 0.15)" gap={24} size={1.5} />
          <Controls className="!bg-card !border-border !rounded-lg overflow-hidden shadow-xl" />
          <MiniMap 
            className="!bg-card/80 !backdrop-blur-md !border-white/10 !rounded-xl overflow-hidden shadow-xl" 
            maskColor="hsl(var(--background) / 0.8)"
            nodeColor="hsl(var(--primary))"
          />
          
          <Panel position="top-left" className="m-4 flex items-center gap-3">
            <Link href="/workflows">
              <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-md border-white/10 hover:bg-secondary">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
            <div className="bg-card/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
              <p className="text-sm font-semibold truncate max-w-[200px]">{workflow?.name}</p>
            </div>
          </Panel>

          <Panel position="top-right" className="m-4 flex gap-2">
            <Button 
              variant="outline" 
              className={`bg-card/80 backdrop-blur-md border-white/10 hover:bg-secondary ${showSuggestions ? "border-amber-500/50 text-amber-400" : ""}`}
              onClick={() => { setShowSuggestions(!showSuggestions); if (!showSuggestions) { setShowVersions(false); setSelectedNode(null); } }}
            >
              <Sparkles className="w-4 h-4 mr-2" /> Optimize
            </Button>
            <Button 
              variant="outline" 
              className={`bg-card/80 backdrop-blur-md border-white/10 hover:bg-secondary ${showVersions ? "border-primary/50 text-primary" : ""}`}
              onClick={() => { setShowVersions(!showVersions); if (!showVersions) { setShowSuggestions(false); setSelectedNode(null); } }}
            >
              <History className="w-4 h-4 mr-2" /> History
            </Button>
            <Button 
              variant="outline" 
              className="bg-card/80 backdrop-blur-md border-white/10 hover:bg-secondary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-0"
              onClick={handleRun}
              disabled={isRunning}
            >
              <Play className="w-4 h-4 mr-2" /> {isRunning ? "Starting..." : "Run"}
            </Button>
          </Panel>

          {nodes.length === 0 && (
            <Panel position="top-center" className="mt-32">
              <div className="bg-card/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center max-w-md shadow-2xl">
                <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start building your workflow</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag a <strong>Trigger</strong> node from the left palette onto this canvas to begin. 
                  Then add more steps by dragging Agent, Condition, or other nodes and connecting them together.
                </p>
                <p className="text-xs text-blue-400">Click the ? icon in the palette for a step-by-step guide.</p>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </main>

      {selectedNode && !showVersions && !showSuggestions && (
        <NodeConfigPanel 
          node={selectedNode} 
          agents={agents || []} 
          onUpdate={handleNodeUpdate} 
          onClose={() => setSelectedNode(null)}
          onDelete={handleNodeDelete}
          workflowId={id}
        />
      )}

      {showVersions && (
        <VersionHistoryPanel
          workflowId={id}
          onRestore={handleVersionRestore}
          onClose={() => setShowVersions(false)}
        />
      )}

      {showSuggestions && (
        <SuggestionsPanel
          workflowId={id}
          onClose={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}

export default function WorkflowEditor() {
  const [match, params] = useRoute("/workflows/:id/edit");
  if (!match) return <div>Invalid route</div>;
  
  return (
    <ReactFlowProvider>
      <EditorCanvas id={Number(params.id)} />
    </ReactFlowProvider>
  );
}
