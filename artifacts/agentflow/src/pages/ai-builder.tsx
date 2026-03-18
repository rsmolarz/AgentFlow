import { useState, useRef, useEffect } from "react";
import { useCreateWorkflow, useListAgents } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Wand2, Send, Loader2, Sparkles, Bot, Zap, Filter, FileOutput, Code2, 
  ArrowRightLeft, AlertTriangle, Timer, RefreshCw, MessageSquare, GitBranch,
  ChevronRight, Lightbulb, ArrowRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const EXAMPLE_PROMPTS = [
  {
    title: "Customer Support Pipeline",
    desc: "Classify incoming tickets, route to the right agent, draft a response, and escalate if needed",
    prompt: "Build a customer support automation that receives incoming support tickets, classifies them by urgency and category, routes high-priority ones to a human reviewer, and uses an AI agent to draft responses for the rest. Include error handling."
  },
  {
    title: "Content Research & Publishing",
    desc: "Research a topic, generate an article, review it, then publish",
    prompt: "Create a content pipeline that takes a topic as input, researches it using an AI agent, generates a blog article with another agent, runs a quality check to see if it meets standards, and if it passes, transforms the output for publishing. If it fails, loop back to the writing agent."
  },
  {
    title: "Data Processing Pipeline",
    desc: "Extract data, transform it, run analysis, and output results",
    prompt: "Build a data processing workflow that triggers on a schedule every hour, pulls data using a code node, transforms and cleans it, sends it to an AI agent for analysis and insights, then outputs the results to a webhook. Add error handling with retries."
  },
  {
    title: "Lead Qualification",
    desc: "Score leads, enrich data, route qualified ones to sales",
    prompt: "Create a lead qualification pipeline that receives new leads via webhook, uses an AI agent to score and enrich them, checks if the score is above 70, routes qualified leads to an output for the CRM, and sends unqualified ones to a nurture email sequence."
  },
  {
    title: "Code Review Automation",
    desc: "Analyze code changes, check for issues, approve or request changes",
    prompt: "Build an automated code review workflow triggered by webhook. Use a code node to parse the diff, an LLM call to analyze code quality, a condition to check if there are critical issues, and route to human review if needed. Output approved reviews automatically."
  },
  {
    title: "Email Campaign Builder",
    desc: "Generate personalized emails, A/B test, send to segments",
    prompt: "Create an email automation that takes a list of contacts, loops through each one, uses an AI agent to generate personalized email content, adds a delay of 30 seconds between sends to avoid rate limits, and outputs the results. Include error handling."
  }
];

interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  agentId?: number;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  sourceHandle?: string;
}

interface GeneratedWorkflow {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  reasoning: string[];
}

function parsePromptToWorkflow(prompt: string, agents: any[]): GeneratedWorkflow {
  const lower = prompt.toLowerCase();
  const reasoning: string[] = [];
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  let y = 80;
  const centerX = 350;
  let nodeIndex = 0;

  const addNode = (type: string, label: string, data: Record<string, any> = {}, xOffset = 0): string => {
    const id = `${type}-${Date.now()}-${nodeIndex++}`;
    const nodeData: WorkflowNode = {
      id,
      type,
      label,
      position: { x: centerX + xOffset, y },
      data: { label, ...data }
    };
    if (data.agentId) nodeData.agentId = data.agentId;
    nodes.push(nodeData);
    y += 140;
    return id;
  };

  const connect = (source: string, target: string, handle?: string) => {
    edges.push({
      id: `e-${source}-${target}`,
      source,
      target,
      sourceHandle: handle,
      ...(handle ? { label: handle === 'pass' ? 'Pass' : 'Fail', condition: handle } : {})
    });
  };

  const defaultAgent = agents?.[0];

  let triggerType = 'manual';
  if (lower.includes('webhook') || lower.includes('incoming') || lower.includes('receives') || lower.includes('api')) {
    triggerType = 'webhook';
    reasoning.push("Detected incoming data pattern - using a Webhook trigger so external systems can send data to start the workflow.");
  } else if (lower.includes('schedule') || lower.includes('every hour') || lower.includes('every day') || lower.includes('daily') || lower.includes('hourly') || lower.includes('cron') || lower.includes('timer')) {
    triggerType = 'schedule';
    const schedule = lower.includes('every hour') || lower.includes('hourly') ? '0 * * * *' : '0 9 * * *';
    reasoning.push(`Detected time-based pattern - using a Scheduled trigger (${schedule}).`);
  } else {
    reasoning.push("No specific trigger pattern detected - using Manual trigger (click to run).");
  }

  const triggerId = addNode('trigger', 
    triggerType === 'webhook' ? 'Receive Data' : triggerType === 'schedule' ? 'Scheduled Run' : 'Manual Start',
    { triggerType, ...(triggerType === 'schedule' ? { schedule: lower.includes('hourly') || lower.includes('every hour') ? '0 * * * *' : '0 9 * * *' } : {}) }
  );
  let lastNodeId = triggerId;

  if (lower.includes('code') && (lower.includes('parse') || lower.includes('extract') || lower.includes('pull') || lower.includes('fetch') || lower.includes('diff'))) {
    reasoning.push("Adding a Code node for data extraction/parsing before AI processing.");
    const codeId = addNode('code', 'Extract & Parse Data', { 
      code: '// Parse and extract relevant data from the input\nconst data = input.data;\nreturn { parsed: data };',
      description: 'Parse and prepare raw data for processing'
    });
    connect(lastNodeId, codeId);
    lastNodeId = codeId;
  }

  if (lower.includes('transform') && (lower.includes('clean') || lower.includes('before'))) {
    reasoning.push("Adding a Transform node to clean and restructure data before processing.");
    const transformId = addNode('transform', 'Clean & Transform', { 
      transformType: 'map',
      description: 'Clean and restructure the incoming data'
    });
    connect(lastNodeId, transformId);
    lastNodeId = transformId;
  }

  const agentKeywords = [
    { keys: ['classify', 'categorize', 'sort', 'score', 'analyze', 'analysis'], label: 'Classify & Analyze', desc: 'Use AI to classify, score, or analyze the input data' },
    { keys: ['research', 'search', 'find', 'investigate', 'look up'], label: 'Research & Gather', desc: 'Research and gather relevant information' },
    { keys: ['write', 'draft', 'generate', 'create content', 'compose', 'article', 'blog', 'email content'], label: 'Generate Content', desc: 'Generate written content using AI' },
    { keys: ['review', 'check quality', 'evaluate', 'assess', 'code quality'], label: 'Review & Evaluate', desc: 'Review and evaluate quality of the output' },
    { keys: ['enrich', 'augment', 'enhance', 'add data'], label: 'Enrich Data', desc: 'Enrich and augment data with additional information' },
    { keys: ['summarize', 'summary', 'condense', 'digest'], label: 'Summarize', desc: 'Create a concise summary of the data' },
    { keys: ['respond', 'reply', 'answer', 'response'], label: 'Draft Response', desc: 'Draft an appropriate response' },
  ];

  let agentCount = 0;
  const matchedAgents: { label: string; desc: string }[] = [];

  for (const ag of agentKeywords) {
    if (ag.keys.some(k => lower.includes(k))) {
      matchedAgents.push(ag);
    }
  }

  if (matchedAgents.length === 0 && (lower.includes('agent') || lower.includes('ai'))) {
    matchedAgents.push({ label: 'AI Processing', desc: 'Process data using an AI agent' });
  }

  if (matchedAgents.length === 0) {
    matchedAgents.push({ label: 'Process with AI', desc: 'Analyze and process the input data' });
  }

  const useLlmCall = lower.includes('llm') || lower.includes('prompt') || lower.includes('summarize') || lower.includes('sentiment');

  for (const ma of matchedAgents) {
    agentCount++;
    if (agentCount > 3) break;

    if (useLlmCall && agentCount === 1) {
      reasoning.push(`Adding an LLM Call node for "${ma.label}" - direct model invocation for this step.`);
      const llmId = addNode('llm_call', ma.label, { 
        model: 'gpt-4o',
        prompt: `Process the following data and ${ma.label.toLowerCase()}:\n\n{{input.data}}`,
        description: ma.desc
      });
      connect(lastNodeId, llmId);
      lastNodeId = llmId;
    } else {
      reasoning.push(`Adding an Agent node for "${ma.label}" - ${defaultAgent ? `using your "${defaultAgent.name}" agent` : 'configure an agent for this step'}.`);
      const agentId = addNode('agent', ma.label, { 
        agentId: defaultAgent?.id,
        agentName: defaultAgent?.name,
        description: ma.desc
      });
      connect(lastNodeId, agentId);
      lastNodeId = agentId;
    }
  }

  const hasCondition = lower.includes('if ') || lower.includes('check') || lower.includes('condition') || 
    lower.includes('route') || lower.includes('qualify') || lower.includes('pass') || lower.includes('fail') || 
    lower.includes('above') || lower.includes('below') || lower.includes('meets') || lower.includes('standard');

  if (hasCondition) {
    let conditionLabel = 'Check Condition';
    let conditionValue = 'true';
    let conditionType = 'contains';

    if (lower.includes('score') && lower.includes('above')) {
      const match = lower.match(/above\s+(\d+)/);
      conditionValue = match ? match[1] : '70';
      conditionType = 'greater_than';
      conditionLabel = `Score > ${conditionValue}?`;
      reasoning.push(`Adding a Condition node to check if the score exceeds ${conditionValue}.`);
    } else if (lower.includes('quality') || lower.includes('standard') || lower.includes('meets')) {
      conditionLabel = 'Quality Check';
      conditionValue = 'pass';
      reasoning.push("Adding a Condition node to check if quality standards are met.");
    } else if (lower.includes('critical') || lower.includes('urgent') || lower.includes('priority')) {
      conditionLabel = 'Priority Check';
      conditionValue = 'high';
      reasoning.push("Adding a Condition node to check priority/urgency level.");
    } else {
      reasoning.push("Adding a Condition node to branch the workflow based on the result.");
    }

    const savedY = y;
    const condId = addNode('condition', conditionLabel, { 
      conditionType,
      conditionValue,
      description: `Branch based on: ${conditionLabel}`
    });
    connect(lastNodeId, condId);

    const hasHumanReview = lower.includes('human') || lower.includes('review') || lower.includes('approve') || lower.includes('escalat');
    const hasLoop = lower.includes('loop') || lower.includes('back to') || lower.includes('retry') || lower.includes('redo');

    if (hasHumanReview) {
      reasoning.push("Adding a Human Review node on the fail/escalation path for manual oversight.");
      const humanId = addNode('human_review', 'Human Review', { 
        reviewInstructions: 'Please review this item and approve or reject it.',
        timeout: 24,
        description: 'Requires manual approval before proceeding'
      }, 250);
      connect(condId, humanId, 'fail');
      
      const mergeId = addNode('merge', 'Merge Results', { 
        mergeStrategy: 'wait_all',
        description: 'Combine results from both paths'
      }, 0);
      y = savedY + 280;
      
      const passOutputId = addNode('output', 'Auto-Approved Output', { 
        outputType: 'return',
        description: 'Output for automatically approved items'
      }, -250);
      connect(condId, passOutputId, 'pass');
      connect(humanId, mergeId);
      connect(passOutputId, mergeId);
      lastNodeId = mergeId;
    } else if (hasLoop) {
      reasoning.push("Adding a loop-back path for items that don't pass the condition.");
      const failAgentId = nodes.find(n => n.type === 'agent' && n.id !== triggerId)?.id;
      if (failAgentId) {
        connect(condId, failAgentId, 'fail');
      }
      lastNodeId = condId;
    } else {
      reasoning.push("Adding separate output paths for pass and fail branches.");
      
      const passY = y;
      const passId = addNode('output', 'Pass Output', { 
        outputType: 'return',
        description: 'Output for items that pass the condition'
      }, -200);
      connect(condId, passId, 'pass');

      y = passY;
      const failId = addNode('output', 'Fail Output', { 
        outputType: lower.includes('email') || lower.includes('nurture') ? 'email' : 'return',
        description: 'Output for items that fail the condition'
      }, 200);
      connect(condId, failId, 'fail');
      lastNodeId = passId;
    }
  }

  const hasLoop = lower.includes('loop') || lower.includes('each') || lower.includes('iterate') || lower.includes('list of') || lower.includes('batch');
  if (hasLoop && !hasCondition) {
    reasoning.push("Adding a Loop node to process items one at a time from a list.");
    const loopId = addNode('loop', 'Process Each Item', { 
      arrayField: 'items',
      maxIterations: 100,
      description: 'Iterate through each item in the list'
    });
    connect(lastNodeId, loopId);
    lastNodeId = loopId;

    if (matchedAgents.length > 0) {
      const innerAgentId = addNode('agent', 'Process Item', { 
        agentId: defaultAgent?.id,
        agentName: defaultAgent?.name,
        description: 'Process each individual item'
      });
      connect(loopId, innerAgentId);
      lastNodeId = innerAgentId;
    }
  }

  const hasDelay = lower.includes('delay') || lower.includes('wait') || lower.includes('pause') || lower.includes('rate limit') || lower.includes('throttle') || lower.includes('between sends');
  if (hasDelay) {
    let delayValue = 5;
    let delayUnit = 'seconds';
    const secMatch = lower.match(/(\d+)\s*second/);
    const minMatch = lower.match(/(\d+)\s*minute/);
    if (secMatch) { delayValue = parseInt(secMatch[1]); delayUnit = 'seconds'; }
    else if (minMatch) { delayValue = parseInt(minMatch[1]); delayUnit = 'minutes'; }
    
    reasoning.push(`Adding a Delay node (${delayValue} ${delayUnit}) to pace the workflow.`);
    const delayId = addNode('delay', `Wait ${delayValue}${delayUnit[0]}`, { 
      delayValue,
      delayUnit,
      description: `Pause for ${delayValue} ${delayUnit}`
    });
    connect(lastNodeId, delayId);
    lastNodeId = delayId;
  }

  const hasErrorHandling = lower.includes('error') || lower.includes('retry') || lower.includes('fallback') || lower.includes('handle failure');
  if (hasErrorHandling) {
    reasoning.push("Adding an Error Handler node for resilience — will catch failures and retry or log them.");
    const errorId = addNode('error_handler', 'Handle Errors', { 
      errorAction: lower.includes('retry') ? 'retry' : 'log',
      maxRetries: 3,
      description: 'Catch and handle any errors in the workflow'
    });
    connect(lastNodeId, errorId);
    lastNodeId = errorId;
  }

  if (lower.includes('transform') && !lower.includes('clean')) {
    reasoning.push("Adding a Transform node to reshape the output data for the final destination.");
    const transformId = addNode('transform', 'Format Output', { 
      transformType: 'map',
      description: 'Format and structure the final output data'
    });
    connect(lastNodeId, transformId);
    lastNodeId = transformId;
  }

  let outputType = 'return';
  if (lower.includes('email') || lower.includes('send email')) outputType = 'email';
  else if (lower.includes('webhook') && lower.includes('output')) outputType = 'webhook';
  else if (lower.includes('slack') || lower.includes('post to')) outputType = 'slack';
  else if (lower.includes('database') || lower.includes('save') || lower.includes('store')) outputType = 'database';
  else if (lower.includes('crm') || lower.includes('publish')) outputType = 'webhook';

  reasoning.push(`Adding an Output node (${outputType}) to deliver the final results.`);
  const outputId = addNode('output', 'Final Output', { 
    outputType,
    description: 'Deliver the workflow results to the destination'
  });
  connect(lastNodeId, outputId);

  return {
    name: generateWorkflowName(prompt),
    description: prompt.slice(0, 200),
    nodes,
    edges,
    reasoning
  };
}

function generateWorkflowName(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('customer support')) return 'Customer Support Automation';
  if (lower.includes('content') && lower.includes('pipeline')) return 'Content Pipeline';
  if (lower.includes('data processing')) return 'Data Processing Pipeline';
  if (lower.includes('lead')) return 'Lead Processing Pipeline';
  if (lower.includes('code review')) return 'Code Review Automation';
  if (lower.includes('email')) return 'Email Automation';
  if (lower.includes('research')) return 'Research Pipeline';
  if (lower.includes('feedback')) return 'Feedback Analysis Pipeline';
  
  const words = prompt.split(/\s+/).slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.join(' ') + ' Workflow';
}

const nodeIconMap: Record<string, any> = {
  trigger: Zap, agent: Bot, condition: Filter, output: FileOutput, code: Code2,
  llm_call: Sparkles, transform: ArrowRightLeft, error_handler: AlertTriangle,
  delay: Timer, loop: RefreshCw, human_review: MessageSquare, merge: GitBranch,
};

const nodeColorMap: Record<string, string> = {
  trigger: "text-emerald-400", agent: "text-blue-400", condition: "text-amber-400",
  output: "text-purple-400", code: "text-slate-400", llm_call: "text-pink-400",
  transform: "text-cyan-400", error_handler: "text-red-400", delay: "text-orange-400",
  loop: "text-violet-400", human_review: "text-yellow-400", merge: "text-teal-400",
};

export default function AIBuilder() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedWorkflow | null>(null);
  const [currentReasoning, setCurrentReasoning] = useState<string[]>([]);

  const { data: agents } = useListAgents();
  const { mutate: createWorkflow, isPending: isCreating } = useCreateWorkflow({
    mutation: {
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
        toast({ title: "Workflow created! Opening in the builder..." });
        if (data?.id) setLocation(`/workflows/${data.id}/edit`);
        else setLocation('/workflows');
      },
      onError: () => toast({ title: "Failed to create workflow", variant: "destructive" })
    }
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerated(null);
    setCurrentReasoning([]);

    const result = parsePromptToWorkflow(prompt, agents || []);
    
    for (let i = 0; i < result.reasoning.length; i++) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      setCurrentReasoning(prev => [...prev, result.reasoning[i]]);
    }
    
    await new Promise(r => setTimeout(r, 500));
    setGenerated(result);
    setIsGenerating(false);
  };

  const handleDeploy = () => {
    if (!generated) return;
    const apiNodes = generated.nodes.map(n => ({
      id: n.id,
      type: n.type as any,
      label: n.label,
      position: n.position,
      data: n.data,
      ...(n.agentId ? { agentId: n.agentId } : {})
    }));
    const apiEdges = generated.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      ...(e.label ? { label: e.label } : {}),
      ...(e.condition ? { condition: e.condition } : {})
    }));
    createWorkflow({
      data: {
        name: generated.name,
        description: generated.description,
        definition: { nodes: apiNodes, edges: apiEdges }
      }
    });
  };

  const handleExampleClick = (exPrompt: string) => {
    setPrompt(exPrompt);
    setGenerated(null);
    setCurrentReasoning([]);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-1.5 rounded-full mb-4">
          <Sparkles className="w-4 h-4" />
          AI-Powered Builder
        </div>
        <h1 className="text-4xl font-display font-bold text-gradient mb-3">
          Describe it. We'll build it.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tell us what you want to automate in plain English. Our AI will design the workflow structure, 
          select the right node types, and wire everything together for you.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want to automate... For example: 'Build a pipeline that receives customer feedback via webhook, analyzes sentiment with AI, routes positive feedback to a thank-you email and negative feedback to a human reviewer for follow-up.'"
            className="bg-secondary/30 border-white/10 text-base min-h-[120px] resize-none pr-14 focus:ring-primary/50"
            rows={4}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          />
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="absolute bottom-3 right-3 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 w-10 p-0"
            title="Generate workflow (Ctrl+Enter)"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] border border-white/10">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] border border-white/10">Enter</kbd> to generate
        </p>
      </div>

      {!generated && !isGenerating && currentReasoning.length === 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Try an example</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Click any example below to use it as a starting point, or write your own from scratch:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(ex.prompt)}
                className="text-left p-4 rounded-xl border border-white/5 bg-secondary/30 hover:bg-secondary/50 hover:border-primary/20 transition-all group"
              >
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{ex.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{ex.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {(isGenerating || currentReasoning.length > 0) && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className={`w-5 h-5 text-primary ${isGenerating ? 'animate-pulse' : ''}`} />
            <h2 className="text-lg font-semibold">
              {isGenerating ? 'Designing your workflow...' : 'Workflow designed!'}
            </h2>
          </div>

          <div className="space-y-2 mb-6">
            {currentReasoning.map((reason, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{reason}</span>
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Analyzing requirements...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {generated && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-display font-bold">{generated.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{generated.description}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
                {generated.nodes.length} nodes
              </div>
            </div>

            <div className="relative py-4">
              <div className="space-y-1">
                {generated.nodes.map((node, i) => {
                  const Icon = nodeIconMap[node.type] || Zap;
                  const color = nodeColorMap[node.type] || 'text-muted-foreground';
                  const isLast = i === generated.nodes.length - 1;

                  return (
                    <div key={node.id}>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-secondary/30">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color.replace('text-', 'bg-').replace('400', '500/10')}`}>
                          <Icon className={`w-4.5 h-4.5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{node.data.label}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {node.type.replace('_', ' ')}
                            {node.data.agentName && ` · ${node.data.agentName}`}
                            {node.data.triggerType && ` · ${node.data.triggerType}`}
                            {node.data.outputType && node.data.outputType !== 'return' && ` · ${node.data.outputType}`}
                          </p>
                        </div>
                        {node.data.description && (
                          <p className="text-[10px] text-muted-foreground hidden sm:block max-w-[200px] text-right">{node.data.description}</p>
                        )}
                      </div>
                      {!isLast && (
                        <div className="flex justify-center py-0.5">
                          <div className="w-px h-3 bg-white/10" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => { setGenerated(null); setCurrentReasoning([]); }}
              className="border-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 px-8"
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><ArrowRight className="w-4 h-4 mr-2" /> Create & Open in Builder</>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Your workflow will be created and opened in the visual editor where you can fine-tune every node's configuration.
          </p>
        </div>
      )}
    </div>
  );
}
