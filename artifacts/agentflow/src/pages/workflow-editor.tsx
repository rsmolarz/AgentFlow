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
import { Play, Save, ChevronLeft, Bot, Zap, Filter, FileOutput, Code2, ShieldAlert, Sparkles, ArrowRightLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// --- Custom Nodes ---

const nodeConfig: Record<string, { icon: any, color: string, border: string }> = {
  trigger: { icon: Zap, color: "bg-emerald-500/10 text-emerald-400", border: "border-emerald-500/30" },
  agent: { icon: Bot, color: "bg-blue-500/10 text-blue-400", border: "border-blue-500/30" },
  condition: { icon: Filter, color: "bg-amber-500/10 text-amber-400", border: "border-amber-500/30" },
  output: { icon: FileOutput, color: "bg-purple-500/10 text-purple-400", border: "border-purple-500/30" },
  code: { icon: Code2, color: "bg-slate-500/10 text-slate-400", border: "border-slate-500/30" },
  llm_call: { icon: Sparkles, color: "bg-pink-500/10 text-pink-400", border: "border-pink-500/30" },
  transform: { icon: ArrowRightLeft, color: "bg-cyan-500/10 text-cyan-400", border: "border-cyan-500/30" },
  default: { icon: ShieldAlert, color: "bg-secondary text-foreground", border: "border-border" }
};

const CustomNode = ({ data, type, isConnectable }: any) => {
  const config = nodeConfig[type] || nodeConfig.default;
  const Icon = config.icon;

  return (
    <div className={`xyflow-custom-node border ${config.border} shadow-lg hover:shadow-xl transition-shadow`}>
      {type !== 'trigger' && (
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-card border-2 border-primary" />
      )}
      <div className={`xyflow-custom-node-header ${config.color.split(' ')[0]}`}>
        <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
        <strong className="text-foreground">{data.label || type}</strong>
      </div>
      <div className="xyflow-custom-node-body text-xs text-muted-foreground">
        {data.description || `Execute ${type} task`}
        {data.agentName && <div className="mt-2 text-primary font-medium">{data.agentName}</div>}
      </div>
      {type !== 'output' && (
        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-card border-2 border-primary" />
      )}
    </div>
  );
};

const nodeTypes = {
  trigger: CustomNode,
  agent: CustomNode,
  condition: CustomNode,
  output: CustomNode,
  code: CustomNode,
  llm_call: CustomNode,
  transform: CustomNode,
};

// --- Main Component ---

function EditorCanvas({ id }: { id: number }) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Data hooks
  const { data: workflow, isLoading } = useGetWorkflow(id);
  const { mutate: updateWorkflow, isPending: isSaving } = useUpdateWorkflow();
  const { mutate: runWorkflow, isPending: isRunning } = useRunWorkflow();
  const { data: agents } = useListAgents();

  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Load initial graph
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

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
      };

      setNodes((nds) => eds => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = () => {
    updateWorkflow({
      workflowId: id,
      data: {
        definition: { nodes, edges } as any
      }
    }, {
      onSuccess: () => toast({ title: "Workflow saved!" })
    });
  };

  const handleRun = () => {
    runWorkflow({
      workflowId: id,
      data: { inputData: {} }
    }, {
      onSuccess: () => toast({ title: "Execution started!" })
    });
  };

  if (isLoading) return <div className="h-full flex items-center justify-center">Loading builder...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      {/* Sidebar Palette */}
      <aside className="w-64 border-r border-white/5 bg-card/40 backdrop-blur-md p-4 flex flex-col z-10 shadow-2xl">
        <h3 className="font-display font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Node Palette</h3>
        <div className="space-y-3">
          {Object.entries(nodeConfig).filter(([k]) => k !== 'default').map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={type}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-secondary/50 cursor-grab hover:bg-secondary hover:border-white/10 transition-colors"
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', type);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                draggable
              >
                <div className={`w-8 h-8 rounded-lg ${config.color.split(' ')[0]} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                </div>
                <span className="text-sm font-medium capitalize">{type}</span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8">
          <h3 className="font-display font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Available Agents</h3>
          <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2">
            {agents?.map(agent => (
               <div
               key={agent.id}
               className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-primary/20 bg-background/30 cursor-grab text-xs"
               onDragStart={(e) => {
                 e.dataTransfer.setData('application/reactflow', 'agent');
                 // Trick to pass agent data to drop handler using a side channel or complex string
               }}
               draggable
             >
               <Bot className="w-3 h-3 text-primary" />
               <span className="truncate">{agent.name}</span>
             </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Canvas */}
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
          nodeTypes={nodeTypes}
          fitView
          className="bg-black/20"
        >
          <Background color="hsl(var(--muted-foreground) / 0.2)" gap={24} size={1.5} />
          <Controls className="!bg-card !border-border !rounded-lg overflow-hidden shadow-xl" />
          <MiniMap 
            className="!bg-card/80 !backdrop-blur-md !border-white/10 !rounded-xl overflow-hidden shadow-xl" 
            maskColor="hsl(var(--background) / 0.8)"
            nodeColor="hsl(var(--primary))"
          />
          
          <Panel position="top-left" className="m-4">
            <Link href="/workflows">
              <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-md border-white/10 hover:bg-secondary">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
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
              <Play className="w-4 h-4 mr-2" /> Run
            </Button>
          </Panel>
        </ReactFlow>
      </main>
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
