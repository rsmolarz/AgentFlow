import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Bot, Workflow, Loader2, Sparkles, X, ArrowRight, Zap } from "lucide-react";

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

export function SemanticSearch() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
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

  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    if (result.type === "agent") {
      navigate(`/agents`);
    } else {
      navigate(`/workflows/${result.id}/edit`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
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
        onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); }}
        onFocus={() => { if (query.trim()) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Search agents, workflows..."
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150">
          {searchMode && (
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
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
              {results.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{results.length} results</span>
              )}
            </div>
          )}

          {results.length > 0 ? (
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
          ) : !isLoading && query.trim() ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results for "{query}"</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Try a different search term or check your spelling</p>
            </div>
          ) : isLoading ? (
            <div className="px-4 py-8 text-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Searching with AI embeddings...</p>
            </div>
          ) : null}

          <div className="px-3 py-2 border-t border-white/5 flex items-center gap-3 text-[10px] text-muted-foreground/50">
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-white/10 font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-white/10 font-mono">↵</kbd> open</span>
            <span><kbd className="px-1 py-0.5 bg-secondary/50 rounded border border-white/10 font-mono">esc</kbd> close</span>
          </div>
        </div>
      )}
    </div>
  );
}
