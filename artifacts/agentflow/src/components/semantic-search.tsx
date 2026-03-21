import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Bot, Workflow, Loader2, Sparkles, X, ArrowRight, Zap, LayoutDashboard, Wand2, ActivitySquare, Database, Blocks, Plug, FlaskConical, Trophy, Settings, GitCompareArrows, FileSpreadsheet, Webhook, Lightbulb, Sun, Moon, type LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface SearchResult {
  id: number;
  type: "agent" | "workflow";
  name: string;
  description: string;
  score: number;
  matchType: string;
  status?: string;
  model?: string;
  tags?: string[];
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  mode: string;
  totalItems?: number;
}

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  category: string;
  shortcut?: string;
}

export function SemanticSearch() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const commands: CommandItem[] = [
    { id: "nav-dashboard", label: "Go to Dashboard", icon: LayoutDashboard, action: () => navigate("/"), category: "Navigation" },
    { id: "nav-agents", label: "Go to Agents", icon: Bot, action: () => navigate("/agents"), category: "Navigation" },
    { id: "nav-workflows", label: "Go to Workflows", icon: Workflow, action: () => navigate("/workflows"), category: "Navigation" },
    { id: "nav-executions", label: "Go to Executions", icon: ActivitySquare, action: () => navigate("/executions"), category: "Navigation" },
    { id: "nav-ai-builder", label: "Go to AI Builder", icon: Wand2, action: () => navigate("/ai-builder"), category: "Navigation" },
    { id: "nav-evaluations", label: "Go to Evaluations", icon: FlaskConical, action: () => navigate("/evaluations"), category: "Navigation" },
    { id: "nav-knowledge", label: "Go to Knowledge Bases", icon: Database, action: () => navigate("/knowledge-bases"), category: "Navigation" },
    { id: "nav-integrations", label: "Go to Integrations", icon: Plug, action: () => navigate("/integrations"), category: "Navigation" },
    { id: "nav-templates", label: "Go to Templates", icon: Blocks, action: () => navigate("/templates"), category: "Navigation" },
    { id: "nav-ab-testing", label: "Go to A/B Testing", icon: GitCompareArrows, action: () => navigate("/ab-testing"), category: "Navigation" },
    { id: "nav-bulk", label: "Go to Bulk Execution", icon: FileSpreadsheet, action: () => navigate("/bulk-execution"), category: "Navigation" },
    { id: "nav-webhooks", label: "Go to Webhooks", icon: Webhook, action: () => navigate("/webhooks"), category: "Navigation" },
    { id: "nav-leaderboard", label: "Go to Leaderboard", icon: Trophy, action: () => navigate("/leaderboard"), category: "Navigation" },
    { id: "nav-settings", label: "Go to Settings", icon: Settings, action: () => navigate("/settings"), category: "Navigation" },
    { id: "nav-features", label: "Go to Feature Requests", icon: Lightbulb, action: () => navigate("/feature-requests"), category: "Navigation" },
    { id: "toggle-theme", label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode", icon: theme === "dark" ? Sun : Moon, action: toggleTheme, category: "Actions" },
  ];

  const filteredCommands = query.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearchMode("");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setSearchMode(data.mode);
    } catch {
      setResults([]);
      setSearchMode("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showingCommands = !query.trim() || (query.trim() && filteredCommands.length > 0 && results.length === 0 && !isLoading);
  const totalItems = showingCommands ? filteredCommands.length : results.length;

  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    if (result.type === "agent") {
      navigate(`/agents`);
    } else {
      navigate(`/workflows/${result.id}/edit`);
    }
  };

  const executeCommand = (cmd: CommandItem) => {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      if (showingCommands && filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      } else if (results[selectedIndex]) {
        navigateToResult(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search or type a command..."
        className="w-full pl-9 pr-20 py-2 bg-secondary/50 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
        {query && !isLoading && (
          <button onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/10 bg-secondary/50 text-[10px] text-muted-foreground font-mono">
          ⌘K
        </kbd>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150">
          {results.length > 0 && !showingCommands ? (
            <>
              {searchMode && (
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {searchMode === "semantic" ? (
                      <>
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span>Semantic search powered by AI embeddings</span>
                      </>
                    ) : searchMode === "fuzzy" ? (
                      <>
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Fuzzy text matching</span>
                      </>
                    ) : null}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{results.length} results</span>
                </div>
              )}
              <ul className="max-h-[360px] overflow-y-auto py-1">
                {results.map((result, i) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        i === selectedIndex ? "bg-primary/10" : "hover:bg-secondary/50"
                      }`}
                      onClick={() => navigateToResult(result)}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        result.type === "agent" ? "bg-blue-500/10" : "bg-purple-500/10"
                      }`}>
                        {result.type === "agent" ? (
                          <Bot className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Workflow className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{result.name}</span>
                          <span className={`text-[10px] font-mono font-bold ${scoreColor(result.score)}`}>
                            {result.score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground capitalize">{result.type}</span>
                          {result.model && <span className="text-[10px] text-muted-foreground/60">{result.model}</span>}
                          {result.status && (
                            <span className={`text-[10px] px-1 py-0.5 rounded ${
                              result.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                              result.status === "draft" ? "bg-amber-500/10 text-amber-400" :
                              "bg-secondary text-muted-foreground"
                            }`}>
                              {result.status}
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground/40 ml-auto">{result.matchType}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : isLoading ? (
            <div className="px-4 py-8 text-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Searching with AI embeddings...</p>
            </div>
          ) : showingCommands && filteredCommands.length > 0 ? (
            <CommandPaletteList commands={filteredCommands} selectedIndex={selectedIndex} onSelect={executeCommand} onHover={setSelectedIndex} />
          ) : query.trim() ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Try a different search term or check your spelling</p>
            </div>
          ) : null}

          <div className="px-3 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground/50">
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-border font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-border font-mono">↵</kbd> {showingCommands ? "run" : "open"}</span>
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-border font-mono">esc</kbd> close</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CommandPaletteList({ commands, selectedIndex, onSelect, onHover }: {
  commands: CommandItem[];
  selectedIndex: number;
  onSelect: (cmd: CommandItem) => void;
  onHover: (idx: number) => void;
}) {
  const categories = [...new Set(commands.map(c => c.category))];
  let globalIndex = 0;

  return (
    <div className="max-h-[360px] overflow-y-auto py-1">
      {categories.map(cat => {
        const items = commands.filter(c => c.category === cat);
        return (
          <div key={cat}>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {cat}
            </div>
            {items.map(cmd => {
              const idx = globalIndex++;
              return (
                <button
                  key={cmd.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    idx === selectedIndex ? "bg-primary/10" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => onSelect(cmd)}
                  onMouseEnter={() => onHover(idx)}
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    <cmd.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm flex-1">{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd className="text-[10px] text-muted-foreground/50 font-mono">{cmd.shortcut}</kbd>
                  )}
                  <ArrowRight className="w-3 h-3 text-muted-foreground/20 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
