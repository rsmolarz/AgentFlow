import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useRoute } from "wouter";
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
  Layers, Globe, Database, BookOpen
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

function NodeConfigPanel({ node, agents, onUpdate, onClose, onDelete }: { 
  node: any; agents: any[]; onUpdate: (id: string, data: any) => void; onClose: () => void; onDelete: (id: string) => void;
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Schedule (cron expression)</Label>
                  <Input value={localData.schedule || ''} onChange={e => update('schedule', e.target.value)} placeholder="*/5 * * * * (every 5 min)" className="bg-secondary/50 border-white/10 h-8 text-sm font-mono" />
                  <p className="text-[10px] text-muted-foreground">Common: <code className="bg-secondary px-1 rounded">0 * * * *</code> hourly, <code className="bg-secondary px-1 rounded">0 9 * * *</code> daily 9am</p>
                </div>
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
        </div>

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

function EditorCanvas({ id }: { id: number }) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  
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
    updateWorkflow({
      workflowId: id,
      data: { definition: { nodes, edges } as any }
    }, {
      onSuccess: () => toast({ title: "Workflow saved!" })
    });
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

      {selectedNode && (
        <NodeConfigPanel 
          node={selectedNode} 
          agents={agents || []} 
          onUpdate={handleNodeUpdate} 
          onClose={() => setSelectedNode(null)}
          onDelete={handleNodeDelete}
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
