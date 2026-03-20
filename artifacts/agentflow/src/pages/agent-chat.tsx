import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetAgent } from "@workspace/api-client-react";
import { 
  Send, Bot, User, ArrowLeft, Sparkles, Wrench, Globe, Code2, 
  Database, Clock, Loader2, Copy, ThumbsUp, ThumbsDown, RotateCcw,
  Settings2, ChevronDown, Zap, Shield, Brain, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date;
  toolName?: string;
  toolResult?: string;
  tokens?: number;
  duration?: number;
  isStreaming?: boolean;
}

const TOOL_ICONS: Record<string, any> = {
  web_search: Globe,
  code_exec: Code2,
  knowledge_base: Database,
  api_call: Zap,
};

const SUGGESTED_PROMPTS = [
  "Summarize the latest updates on our project",
  "Draft a professional email responding to a customer complaint",
  "Analyze this dataset and identify key trends",
  "Create a step-by-step plan for the upcoming product launch",
  "Review this code for potential bugs and improvements",
  "Generate test cases for the authentication module",
];

function simulateResponse(userMsg: string, agentName: string): { messages: ChatMessage[]; delay: number } {
  const toolUsed = userMsg.toLowerCase().includes("search") || userMsg.toLowerCase().includes("find") || userMsg.toLowerCase().includes("latest");
  const codeUsed = userMsg.toLowerCase().includes("code") || userMsg.toLowerCase().includes("bug") || userMsg.toLowerCase().includes("test");
  
  const messages: ChatMessage[] = [];
  let responseText = "";

  if (toolUsed) {
    messages.push({
      id: `tool-${Date.now()}`,
      role: "tool",
      content: "Searching the web for relevant information...",
      toolName: "web_search",
      toolResult: `Found 5 relevant results for "${userMsg.slice(0, 40)}..."`,
      timestamp: new Date(),
    });
  }

  if (codeUsed) {
    messages.push({
      id: `tool-${Date.now() + 1}`,
      role: "tool",
      content: "Executing code analysis...",
      toolName: "code_exec",
      toolResult: "Analysis complete. Found 3 areas for improvement.",
      timestamp: new Date(),
    });
  }

  if (userMsg.toLowerCase().includes("email") || userMsg.toLowerCase().includes("draft")) {
    responseText = `Here's a professional response I've drafted:\n\n**Subject: Re: Your Recent Inquiry**\n\nDear Customer,\n\nThank you for reaching out to us. I understand your concern and want to assure you that we take all feedback seriously.\n\nAfter reviewing your case, I'd like to propose the following resolution:\n\n1. **Immediate action**: We'll process your request within 24 hours\n2. **Follow-up**: A dedicated team member will reach out to confirm resolution\n3. **Prevention**: We've noted this feedback to improve our processes\n\nPlease don't hesitate to reach out if you need anything else.\n\nBest regards,\n${agentName}`;
  } else if (userMsg.toLowerCase().includes("analyze") || userMsg.toLowerCase().includes("trend")) {
    responseText = `Based on my analysis, here are the key findings:\n\n**Key Trends Identified:**\n\n📈 **Growth Pattern**: 23% increase in engagement over the last quarter\n📊 **User Segments**: Mobile users now account for 67% of traffic\n🔄 **Retention**: Day-7 retention improved from 34% to 41%\n⚡ **Performance**: Average response time decreased by 180ms\n\n**Recommendations:**\n- Focus mobile-first development efforts\n- Implement push notifications for re-engagement\n- A/B test the new onboarding flow\n\nWould you like me to dive deeper into any of these areas?`;
  } else if (codeUsed) {
    responseText = "Here's my code review analysis:\n\n**Issues Found:**\n\n1. 🔴 **Critical**: Unhandled promise rejection in `auth.service.ts:45`\n   ```typescript\n   // Before: missing error handling\n   const user = await getUser(id);\n   // After: proper error handling\n   const user = await getUser(id).catch(err => {\n     logger.error('Failed to get user', err);\n     throw new AuthError('User lookup failed');\n   });\n   ```\n\n2. 🟡 **Warning**: SQL injection vulnerability in query builder\n3. 🟢 **Suggestion**: Consider using connection pooling for database calls\n\n**Test Cases Generated:**\n- `should handle invalid user IDs gracefully`\n- `should reject expired authentication tokens`\n- `should rate-limit failed login attempts`";
  } else if (userMsg.toLowerCase().includes("plan") || userMsg.toLowerCase().includes("step")) {
    responseText = `Here's a structured plan:\n\n## Project Launch Plan\n\n### Phase 1: Preparation (Week 1-2)\n- [ ] Finalize feature requirements\n- [ ] Complete QA testing\n- [ ] Prepare marketing materials\n\n### Phase 2: Soft Launch (Week 3)\n- [ ] Deploy to staging environment\n- [ ] Conduct beta testing with select users\n- [ ] Gather and incorporate feedback\n\n### Phase 3: Full Launch (Week 4)\n- [ ] Production deployment\n- [ ] Monitor metrics and performance\n- [ ] Execute marketing campaign\n\n### Phase 4: Post-Launch (Week 5+)\n- [ ] Analyze user feedback\n- [ ] Prioritize improvements\n- [ ] Plan next iteration\n\nShall I elaborate on any specific phase?`;
  } else {
    responseText = `I've processed your request. Here's what I found:\n\nBased on the information available, I can provide a comprehensive response to your query about "${userMsg.slice(0, 50)}${userMsg.length > 50 ? '...' : ''}".\n\n**Summary:**\nI've analyzed the available data and context to provide you with actionable insights. The key points are:\n\n1. The current approach aligns well with best practices\n2. There are a few areas where we can optimize\n3. I recommend reviewing the implementation with the team\n\nWould you like me to go into more detail on any specific aspect?`;
  }

  messages.push({
    id: `msg-${Date.now() + 2}`,
    role: "assistant",
    content: responseText,
    timestamp: new Date(),
    tokens: Math.floor(Math.random() * 800 + 200),
    duration: +(Math.random() * 3 + 0.5).toFixed(2),
  });

  return { messages, delay: toolUsed || codeUsed ? 2500 : 1500 };
}

export default function AgentChat() {
  const [, params] = useRoute("/agents/:id/chat");
  const agentId = params?.id ? Number(params.id) : 0;
  const { data: agent, isLoading } = useGetAgent(agentId);
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (agent) {
      setMessages([{
        id: "system-welcome",
        role: "system",
        content: `Connected to **${agent.name}** (${agent.model || 'gpt-4o'}). Role: ${agent.role || 'General Assistant'}. Memory: enabled. Tools: web search, code execution, knowledge base.`,
        timestamp: new Date(),
      }]);
    }
  }, [agent]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    const { messages: responseMsgs, delay } = simulateResponse(input.trim(), agent?.name || "Agent");

    const toolMsgs = responseMsgs.filter(m => m.role === "tool");
    const assistantMsg = responseMsgs.find(m => m.role === "assistant")!;

    if (toolMsgs.length > 0) {
      setTimeout(() => {
        setMessages(prev => [...prev, ...toolMsgs]);
      }, 800);
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { ...assistantMsg, isStreaming: true }]);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, isStreaming: false } : m));
        setIsProcessing(false);
      }, 600);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const providerColor = agent?.provider === 'openai' ? 'text-emerald-400' : agent?.provider === 'anthropic' ? 'text-orange-400' : 'text-blue-400';

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link href="/agents">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">{agent?.name || "Agent"}</h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className={providerColor}>{agent?.model || 'gpt-4o'}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Brain className="w-2.5 h-2.5" /> Memory On</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Guardrails</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowConfig(!showConfig)}>
              <Settings2 className="w-3.5 h-3.5 mr-1" /> Config
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
              setMessages([]);
              toast({ title: "Conversation cleared" });
            }}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {messages.length <= 1 && (
              <div className="pt-12 pb-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-bold mb-2">Chat with {agent?.name || "Agent"}</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    This agent has access to tools and memory. Ask anything — it will use its configured capabilities to help you.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(prompt); }}
                      className="text-left p-3 rounded-xl border border-white/5 bg-secondary/30 hover:bg-secondary/50 hover:border-white/10 transition-all text-xs text-muted-foreground"
                    >
                      <Sparkles className="w-3 h-3 text-primary mb-1" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 text-xs text-muted-foreground max-w-md text-center">
                      <MessageSquare className="w-3 h-3 inline mr-1 text-primary" />
                      <span>{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                    </div>
                  </div>
                );
              }

              if (msg.role === "tool") {
                const ToolIcon = TOOL_ICONS[msg.toolName || ""] || Wrench;
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 text-xs max-w-sm">
                      <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                        <ToolIcon className="w-3 h-3" />
                        <span className="font-medium capitalize">{msg.toolName?.replace('_', ' ') || 'Tool'}</span>
                        <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                      </div>
                      <p className="text-muted-foreground">{msg.content}</p>
                      {msg.toolResult && (
                        <p className="text-emerald-400 mt-1 text-[10px]">✓ {msg.toolResult}</p>
                      )}
                    </div>
                  </div>
                );
              }

              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 text-sm">
                        {msg.content}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="bg-secondary/50 border border-white/5 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed">
                        {msg.isStreaming ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                          </span>
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none [&_strong]:text-foreground [&_pre]:bg-black/30 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:text-xs [&_h2]:text-base [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:mt-2 [&_li]:my-0.5">
                            {msg.content.split('\n').map((line, li) => {
                              const codeBlockMatch = line.match(/^```/);
                              if (codeBlockMatch) return null;
                              if (line.startsWith('## ')) return <h2 key={li}>{line.slice(3)}</h2>;
                              if (line.startsWith('### ')) return <h3 key={li}>{line.slice(4)}</h3>;
                              const parts = line.split(/(\*\*.*?\*\*)/g).map((part, pi) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return <strong key={pi}>{part.slice(2, -2)}</strong>;
                                }
                                return <span key={pi}>{part.replace(/- \[ \]/g, '☐').replace(/- \[x\]/g, '☑')}</span>;
                              });
                              return <p key={li} className="my-0.5">{parts}</p>;
                            })}
                          </div>
                        )}
                      </div>
                      {!msg.isStreaming && (
                        <div className="flex items-center gap-2 mt-1.5 px-1">
                          <span className="text-[10px] text-muted-foreground">
                            {msg.tokens && `${msg.tokens} tokens`}
                            {msg.duration && ` · ${msg.duration}s`}
                          </span>
                          <div className="flex items-center gap-0.5 ml-auto">
                            <button className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" onClick={() => { navigator.clipboard.writeText(msg.content); toast({ title: "Copied" }); }}>
                              <Copy className="w-3 h-3" />
                            </button>
                            <button className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-emerald-400 transition-colors">
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-red-400 transition-colors">
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border bg-card/60 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${agent?.name || 'Agent'}...`}
                  className="w-full resize-none bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px] max-h-[200px]"
                  rows={1}
                  disabled={isProcessing}
                />
              </div>
              <Button 
                size="icon" 
                className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> Web Search</span>
              <span className="flex items-center gap-1"><Code2 className="w-2.5 h-2.5" /> Code Execution</span>
              <span className="flex items-center gap-1"><Database className="w-2.5 h-2.5" /> Knowledge Base</span>
              <span className="ml-auto">Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>

      {showConfig && (
        <aside className="w-72 border-l border-border bg-card/60 backdrop-blur-sm p-4 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Agent Configuration
          </h3>
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-white/5 bg-secondary/30 space-y-2">
              <p className="font-medium">Model</p>
              <p className="text-muted-foreground">{agent?.model || 'gpt-4o'}</p>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-secondary/30 space-y-2">
              <p className="font-medium">Provider</p>
              <p className={`${providerColor} capitalize`}>{agent?.provider || 'openai'}</p>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-secondary/30 space-y-2">
              <p className="font-medium">Temperature</p>
              <p className="text-muted-foreground">{agent?.temperature ?? 0.7}</p>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-secondary/30 space-y-2">
              <p className="font-medium">Role</p>
              <p className="text-muted-foreground">{agent?.role || 'General assistant'}</p>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-secondary/30 space-y-2">
              <p className="font-medium">System Prompt</p>
              <p className="text-muted-foreground line-clamp-4">{agent?.systemPrompt || 'You are a helpful AI assistant.'}</p>
            </div>
            <div className="p-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 space-y-2">
              <p className="font-medium text-emerald-400">Active Tools</p>
              <div className="flex flex-wrap gap-1">
                {["Web Search", "Code Exec", "Knowledge Base", "API Calls"].map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">{t}</span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-purple-500/10 bg-purple-500/5 space-y-2">
              <p className="font-medium text-purple-400">Memory</p>
              <p className="text-muted-foreground">Conversation memory enabled. Last 20 messages retained.</p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
