import { useListTemplates, useApplyTemplate } from "@workspace/api-client-react";
import { Blocks, Copy, Sparkles, Info, Bot, Workflow, Tag, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Templates() {
  const { data: templates, isLoading } = useListTemplates();
  
  const agentTemplates = templates?.filter(t => t.category === 'agent') || [];
  const workflowTemplates = templates?.filter(t => t.category === 'workflow') || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Sparkles className="w-32 h-32 text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Template Gallery</h1>
          <p className="text-muted-foreground text-lg mb-2">Jumpstart your development with pre-configured agents and workflows curated by experts.</p>
          <p className="text-sm text-muted-foreground">Click "Use" on any template to instantly create a ready-to-use agent or workflow. You can customize it after applying.</p>
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p><strong className="text-foreground">How templates work:</strong> Templates are pre-built configurations that create real agents or workflows in your account with one click. After applying a template, you own the result and can modify it however you like. Think of templates as starting points, not fixed solutions.</p>
        </div>
      </div>

      {agentTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            Agent Templates
          </h2>
          <p className="text-sm text-muted-foreground">Pre-configured AI agents ready to use. Each comes with a system prompt, model settings, and tool assignments.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentTemplates.map(t => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}

      {workflowTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Workflow className="w-5 h-5 text-purple-400" />
            Workflow Templates
          </h2>
          <p className="text-sm text-muted-foreground">Complete automated pipelines with multiple connected steps. Apply one and open it in the visual builder to customize.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowTemplates.map(t => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-secondary/50 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && (!templates || templates.length === 0) && (
        <div className="text-center py-16 glass-card rounded-3xl">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No templates available</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Templates will appear here as they are added to the platform.</p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: any }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useApplyTemplate({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Template applied successfully! Redirecting..." });
        if (data.workflowId) setLocation(`/workflows/${data.workflowId}/edit`);
        else if (data.agentId) setLocation('/agents');
      },
      onError: () => toast({ title: "Failed to apply template", variant: "destructive" })
    }
  });

  const categoryColor = template.category === 'agent' 
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col group border border-white/5 hover:border-primary/30 transition-all">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${categoryColor}`}>
          {template.category}
        </span>
      </div>
      <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
      <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-3">{template.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex gap-1.5 flex-wrap">
          {template.tags?.slice(0,2).map((tag: string) => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded border border-white/5 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
        <Button 
          size="sm" 
          className="bg-white/10 hover:bg-primary hover:text-white text-foreground transition-colors"
          onClick={() => mutate({ templateId: template.id })}
          disabled={isPending}
        >
          {isPending ? "Applying..." : (
            <>
              <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Use
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
