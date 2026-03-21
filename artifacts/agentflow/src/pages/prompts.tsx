import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  FileText, Plus, Search, Edit2, Trash2, Copy, Tag, X, Save, Loader2,
  BookOpen, Code2, Headphones, Mail, Brain, Shield, Sparkles, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const API_BASE = import.meta.env.VITE_API_URL || "";

const categoryOptions = ["general", "assistant", "coding", "writing", "analysis", "support", "sales", "custom"];
const categoryIcons: Record<string, any> = {
  general: Brain, assistant: Sparkles, coding: Code2, writing: FileText,
  analysis: Filter, support: Headphones, sales: Mail, custom: BookOpen,
};
const categoryColors: Record<string, string> = {
  general: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  assistant: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  coding: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  writing: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  analysis: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  support: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  sales: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  custom: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

interface Prompt {
  id: number;
  name: string;
  content: string;
  category: string;
  tags: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function Prompts() {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchPrompts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/prompts`);
      if (res.ok) setPrompts(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this prompt?")) return;
    const res = await fetch(`${API_BASE}/api/prompts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrompts(p => p.filter(x => x.id !== id));
      toast({ title: "Prompt deleted" });
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Prompt copied to clipboard!" });
  };

  const filtered = prompts
    .filter(p => categoryFilter === "all" || p.category === categoryFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Prompt Library
          </h1>
          <p className="text-muted-foreground mt-1">Save, organize, and reuse your best system prompts across agents.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border-0">
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Create Prompt</DialogTitle>
            </DialogHeader>
            <PromptForm
              onSave={async (data) => {
                const res = await fetch(`${API_BASE}/api/prompts`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                if (res.ok) {
                  await fetchPrompts();
                  setIsCreateOpen(false);
                  toast({ title: "Prompt created!" });
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${categoryFilter === "all" ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {categoryOptions.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${categoryFilter === cat ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-2xl p-6 border border-white/5 bg-secondary/20 animate-pulse">
              <div className="h-5 w-16 bg-secondary/50 rounded mb-3" />
              <div className="h-5 w-3/4 bg-secondary/50 rounded mb-2" />
              <div className="space-y-1.5 mb-4">
                <div className="h-3 w-full bg-secondary/50 rounded" />
                <div className="h-3 w-2/3 bg-secondary/50 rounded" />
              </div>
              <div className="h-20 w-full bg-secondary/30 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <BookOpen className="w-10 h-10 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">
            {prompts.length === 0 ? "No prompts yet" : "No prompts match your search"}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {prompts.length === 0 ? "Create your first prompt to get started. Save system prompts you use often so you can reuse them across agents." : "Try adjusting your search or category filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(prompt => {
            const CatIcon = categoryIcons[prompt.category] || Brain;
            const catColor = categoryColors[prompt.category] || categoryColors.general;
            const isExpanded = expandedId === prompt.id;

            return (
              <div key={prompt.id} className="glass-card rounded-2xl p-5 flex flex-col border border-white/5 hover:border-primary/20 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${catColor}`}>
                    {prompt.category}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(prompt.content)} title="Copy">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingPrompt(prompt)} title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(prompt.id)} title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-base mb-1">{prompt.name}</h3>
                {prompt.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{prompt.description}</p>
                )}

                <div
                  className="bg-black/20 border border-white/5 rounded-lg p-3 text-xs font-mono text-muted-foreground cursor-pointer flex-1 mb-3"
                  onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                >
                  <pre className={`whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-4"}`}>
                    {prompt.content}
                  </pre>
                  {!isExpanded && prompt.content.length > 200 && (
                    <span className="text-primary text-[10px] mt-1 block">Click to expand...</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                  <div className="flex gap-1.5 flex-wrap">
                    {(prompt.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {prompt.updatedAt ? format(new Date(prompt.updatedAt), "MMM d") : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingPrompt} onOpenChange={open => !open && setEditingPrompt(null)}>
        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Edit Prompt</DialogTitle>
          </DialogHeader>
          {editingPrompt && (
            <PromptForm
              initial={editingPrompt}
              onSave={async (data) => {
                const res = await fetch(`${API_BASE}/api/prompts/${editingPrompt.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                if (res.ok) {
                  await fetchPrompts();
                  setEditingPrompt(null);
                  toast({ title: "Prompt updated!" });
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromptForm({ initial, onSave }: { initial?: Partial<Prompt>; onSave: (data: any) => Promise<void> }) {
  const [name, setName] = useState(initial?.name || "");
  const [content, setContent] = useState(initial?.content || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || "general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    await onSave({ name, content, description, category, tags });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Customer Support Agent Prompt" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of what this prompt does" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
        >
          {categoryOptions.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Prompt Content</label>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="You are a helpful assistant that..."
          rows={8}
          className="font-mono text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Tags</label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="flex-1"
          />
          <Button variant="outline" onClick={addTag} type="button">Add</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {tags.map(tag => (
              <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                {tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <Button onClick={handleSubmit} disabled={!name.trim() || !content.trim() || saving} className="w-full">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {initial ? "Update Prompt" : "Save Prompt"}</>}
      </Button>
    </div>
  );
}
