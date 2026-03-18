import { useState } from "react";
import { useListKnowledgeBases, useCreateKnowledgeBase, useDeleteKnowledgeBase } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Database, Plus, Search, FileText, Trash2, HardDrive } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function KnowledgeBases() {
  const { data: kbs, isLoading } = useListKnowledgeBases();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient">Knowledge Bases</h1>
          <p className="text-muted-foreground mt-1">Vector memory and documents for your agents via RAG.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border-0">
              <Plus className="w-4 h-4 mr-2" />
              New Database
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Create Knowledge Base</DialogTitle>
            </DialogHeader>
            <CreateKBForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-secondary/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : kbs?.length === 0 ? (
         <div className="text-center py-24 glass-card rounded-3xl">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">No knowledge bases</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">Create a vector database to give your agents access to private documents and data.</p>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white">Create Database</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kbs?.map(kb => (
            <KBCard key={kb.id} kb={kb} />
          ))}
        </div>
      )}
    </div>
  );
}

function KBCard({ kb }: { kb: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: deleteKb, isPending } = useDeleteKnowledgeBase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
        toast({ title: "Deleted" });
      }
    }
  });

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center">
          <HardDrive className="w-5 h-5 text-teal-400" />
        </div>
        <div className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${
          kb.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
          'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {kb.status}
        </div>
      </div>
      
      <h3 className="font-semibold text-lg text-foreground mb-1">{kb.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
        {kb.description || "Vector storage for retrieval augmented generation."}
      </p>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-background/50 border border-white/5 rounded-lg p-2.5 text-center">
          <div className="text-lg font-display font-bold text-foreground">{kb.documentCount || 0}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Documents</div>
        </div>
        <div className="bg-background/50 border border-white/5 rounded-lg p-2.5 text-center">
          <div className="text-lg font-display font-bold text-foreground">{kb.totalChunks || 0}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Chunks</div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded">
          {kb.embeddingModel || 'text-embedding-3-small'}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => { if(confirm("Delete KB?")) deleteKb({ knowledgeBaseId: kb.id }) }}
          disabled={isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function CreateKBForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate, isPending } = useCreateKnowledgeBase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
        toast({ title: "Knowledge Base created" });
        onSuccess();
      }
    }
  });

  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Database Name</Label>
        <Input 
          required 
          placeholder="e.g. Technical Docs"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="bg-secondary/50"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input 
          placeholder="Optional description"
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="bg-secondary/50"
        />
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-primary text-white">
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
