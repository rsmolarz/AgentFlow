import { useListTemplates, useApplyTemplate } from "@workspace/api-client-react";
import { Blocks, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Templates() {
  const { data: templates, isLoading } = useListTemplates();
  
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Sparkles className="w-32 h-32 text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Template Gallery</h1>
          <p className="text-muted-foreground text-lg mb-6">Jumpstart your development with pre-configured agents and workflows curated by experts.</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2">
          <Blocks className="w-5 h-5 text-primary" />
          Featured Workflows
        </h2>
        
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1,2,3].map(i => <div key={i} className="h-40 bg-secondary/50 rounded-2xl animate-pulse" />)}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map(t => (
              <TemplateCard key={t.id} template={t} />
            ))}
            {(!templates || templates.length === 0) && (
              <p className="text-muted-foreground col-span-3 text-center py-12">No templates available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: any }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useApplyTemplate({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Template Applied!" });
        if (data.workflowId) setLocation(`/workflows/${data.workflowId}/edit`);
        else if (data.agentId) setLocation('/agents');
      },
      onError: () => toast({ title: "Failed to apply template", variant: "destructive" })
    }
  });

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col group border border-white/5 hover:border-primary/30">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-secondary text-muted-foreground`}>
          {template.category}
        </span>
      </div>
      <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
      <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-3">{template.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex gap-1">
          {template.tags?.slice(0,2).map((tag: string) => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded border border-white/5">
              #{tag}
            </span>
          ))}
        </div>
        <Button 
          size="sm" 
          className="bg-white/10 hover:bg-primary hover:text-white text-foreground transition-colors"
          onClick={() => mutate({ templateId: template.id })}
          disabled={isPending}
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Use
        </Button>
      </div>
    </div>
  );
}
