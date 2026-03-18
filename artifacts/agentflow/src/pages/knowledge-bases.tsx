import { useState } from "react";
import { useListKnowledgeBases, useCreateKnowledgeBase, useDeleteKnowledgeBase } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Database, Plus, Search, FileText, Trash2, HardDrive, Upload, Info, HelpCircle, File, FileUp, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function KnowledgeBases() {
  const { data: kbs, isLoading } = useListKnowledgeBases();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedKb, setSelectedKb] = useState<any>(null);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gradient">Knowledge Bases</h1>
          <p className="text-muted-foreground mt-1">Vector memory and documents for your agents via RAG (Retrieval Augmented Generation).</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 border-0">
              <Plus className="w-4 h-4 mr-2" />
              New Database
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Create Knowledge Base</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">A knowledge base stores your documents so AI agents can search and reference them when answering questions.</p>
            </DialogHeader>
            <CreateKBForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong className="text-foreground">What is a Knowledge Base?</strong> A knowledge base is a collection of your documents (PDFs, text files, web pages) that gets broken into searchable chunks. When an AI agent needs information, it searches the knowledge base to find relevant pieces — this is called RAG (Retrieval Augmented Generation).</p>
          <p><strong className="text-foreground">How it works:</strong> 1) Create a database below. 2) Upload documents to it. 3) Documents get automatically chunked and indexed. 4) Connect the database to an agent, and it can now answer questions using your data.</p>
        </div>
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
          <p className="text-muted-foreground max-w-md mx-auto mb-6">Create a vector database to give your agents access to your own documents and data. This lets agents answer questions using information you provide, rather than just their built-in training.</p>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary text-white">Create Your First Knowledge Base</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kbs?.map(kb => (
            <KBCard key={kb.id} kb={kb} onSelect={setSelectedKb} />
          ))}
        </div>
      )}

      {selectedKb && (
        <KBDetailPanel kb={selectedKb} onClose={() => setSelectedKb(null)} />
      )}
    </div>
  );
}

function KBCard({ kb, onSelect }: { kb: any; onSelect: (kb: any) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: deleteKb, isPending } = useDeleteKnowledgeBase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/knowledge-bases"] });
        toast({ title: "Knowledge base deleted" });
      }
    }
  });

  return (
    <div 
      className="glass-card rounded-2xl p-6 flex flex-col group relative overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => onSelect(kb)}
    >
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
        <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded" title="The AI model used to create searchable embeddings from your text">
          {kb.embeddingModel || 'text-embedding-3-small'}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); if(confirm("Delete this knowledge base and all its documents?")) deleteKb({ knowledgeBaseId: kb.id }) }}
          disabled={isPending}
          title="Delete knowledge base"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function KBDetailPanel({ kb, onClose }: { kb: any; onClose: () => void }) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); toast({ title: "Document upload simulated. In production, this would process and chunk the file." }); };

  const sampleDocs = [
    { name: "product-manual-v3.pdf", type: "PDF", size: "2.4 MB", chunks: 156, status: "indexed" },
    { name: "api-reference.md", type: "Markdown", size: "890 KB", chunks: 89, status: "indexed" },
    { name: "faq-database.csv", type: "CSV", size: "1.1 MB", chunks: 234, status: "indexed" },
    { name: "support-tickets-2024.json", type: "JSON", size: "3.7 MB", chunks: 412, status: "processing" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-card border-l border-white/10 overflow-y-auto animate-in slide-in-from-right-5 duration-200">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-white/5 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-teal-400" />
              {kb.name}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="text-lg">&times;</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{kb.description}</p>
        </div>

        <div className="p-6 space-y-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'
            }`}
            onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          >
            <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Upload Documents</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, TXT, Markdown, CSV, JSON, HTML (max 50MB per file)
            </p>
            <Button variant="outline" className="mt-4" onClick={() => toast({ title: "File browser would open here. Documents get automatically chunked and indexed." })}>
              <Upload className="w-4 h-4 mr-2" /> Browse Files
            </Button>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-xs text-muted-foreground">
            <p><strong className="text-foreground">How uploading works:</strong> When you upload a document, it gets split into small overlapping chunks (like paragraphs). Each chunk is converted into a mathematical vector using the embedding model. When an agent searches the knowledge base, it finds the most relevant chunks and uses them as context.</p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Documents ({kb.documentCount || sampleDocs.length})
            </h3>
            <div className="space-y-2">
              {sampleDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <File className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.type} &middot; {doc.size} &middot; {doc.chunks} chunks</p>
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${
                    doc.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  }`}>
                    {doc.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-secondary/30 p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Configuration
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Embedding Model</p>
                <p className="font-mono text-xs">{kb.embeddingModel || 'text-embedding-3-small'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Chunk Size</p>
                <p className="font-mono text-xs">512 tokens</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Chunk Overlap</p>
                <p className="font-mono text-xs">50 tokens</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                <p className="text-xs capitalize text-emerald-400">{kb.status || 'ready'}</p>
              </div>
            </div>
          </div>
        </div>
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
        toast({ title: "Knowledge base created! Now upload documents to it." });
        onSuccess();
      }
    }
  });

  const [formData, setFormData] = useState({ name: "", description: "", embeddingModel: "text-embedding-3-small" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ data: formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-1.5">
        <Label>Database Name <span className="text-red-400">*</span></Label>
        <Input 
          required 
          placeholder="e.g. Product Documentation, Support FAQ"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="bg-secondary/50"
        />
        <p className="text-[10px] text-muted-foreground">Choose a name that describes what documents this database will contain.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea 
          placeholder="What kind of documents will be stored here?"
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          className="bg-secondary/50 resize-none"
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          Embedding Model
          <span className="text-blue-400 cursor-help" title="The model that converts text into searchable vectors. Smaller models are faster, larger models are more accurate."><HelpCircle className="w-3 h-3" /></span>
        </Label>
        <Select value={formData.embeddingModel} onValueChange={v => setFormData({...formData, embeddingModel: v})}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text-embedding-3-small">text-embedding-3-small (fast, cheap)</SelectItem>
            <SelectItem value="text-embedding-3-large">text-embedding-3-large (more accurate)</SelectItem>
            <SelectItem value="text-embedding-ada-002">text-embedding-ada-002 (legacy)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">The small model works great for most use cases. Use large for highly technical content.</p>
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-primary text-white">
          {isPending ? "Creating..." : "Create Knowledge Base"}
        </Button>
      </div>
    </form>
  );
}
