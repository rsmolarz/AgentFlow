/**
 * LocalShellNode
 * 
 * File: artifacts/agentflow/src/components/workflow/nodes/LocalShellNode.tsx
 * 
 * A workflow node that executes a shell command on a connected local Mac
 * via the AgentFlow Bridge. Supports variable interpolation, streaming output,
 * and configurable working directory and timeout.
 * 
 * Register this node in your React Flow nodeTypes:
 *   import { LocalShellNode } from './nodes/LocalShellNode';
 *   const nodeTypes = {
 *     ...existingNodeTypes,
 *     localShell: LocalShellNode,
 *   };
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Monitor, Terminal, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';

export interface LocalShellNodeData {
  label?: string;
  machineId?: string;       // Bridge machine DB id
  machineName?: string;     // Display only
  command: string;          // Shell command, supports {{variable}} interpolation
  cwd?: string;             // Working directory on the remote machine
  timeoutMs?: number;       // Default 300000 (5 min)
  captureOutput?: boolean;  // Pass stdout to next node as output
  continueOnError?: boolean;// Don't fail workflow if exit code != 0
}

interface BridgeMachine {
  id: string;
  name: string;
  hostname?: string;
  status: 'online' | 'offline';
  isLive: boolean;
}

const DEFAULT_TIMEOUT_OPTIONS = [
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
  { label: '15 minutes', value: 900000 },
  { label: '30 minutes', value: 1800000 },
  { label: '1 hour', value: 3600000 },
];

export function LocalShellNode({ id, data, selected }: NodeProps<LocalShellNodeData>) {
  const { updateNodeData } = useReactFlow();
  const [expanded, setExpanded] = useState(false);
  const [machines, setMachines] = useState<BridgeMachine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);

  const update = useCallback(
    (patch: Partial<LocalShellNodeData>) => updateNodeData(id, patch),
    [id, updateNodeData]
  );

  useEffect(() => {
    if (!expanded) return;
    setLoadingMachines(true);
    fetch('/api/bridge/machines')
      .then(r => r.json())
      .then((ms: BridgeMachine[]) => { setMachines(ms); setLoadingMachines(false); })
      .catch(() => setLoadingMachines(false));
  }, [expanded]);

  const selectedMachine = machines.find(m => m.id === data.machineId);
  const isOnline = selectedMachine?.isLive ?? false;

  return (
    <div
      className={`
        relative rounded-xl border transition-all duration-150 min-w-[280px] max-w-[320px]
        ${selected
          ? 'border-violet-500 shadow-lg shadow-violet-500/20'
          : 'border-slate-700/60 hover:border-slate-600'
        }
        bg-slate-900/95 backdrop-blur
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-600 !border-slate-500"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex-shrink-0">
          <Monitor className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">
            Local Shell
          </div>
          <div className="text-[13px] font-medium text-slate-200 truncate leading-tight">
            {data.label || 'Run Command'}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Collapsed preview */}
      {!expanded && (
        <div className="px-3.5 pb-3">
          {/* Machine badge */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              !data.machineId ? 'bg-slate-600' :
              isOnline ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
            <span className="text-[11px] text-slate-400 truncate">
              {selectedMachine?.name ?? data.machineName ?? (data.machineId ? 'Machine set' : 'No machine selected')}
            </span>
          </div>
          {/* Command preview */}
          {data.command ? (
            <div className="flex items-start gap-1.5">
              <Terminal className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
              <code className="text-[11px] text-slate-400 font-mono leading-tight truncate">
                {data.command}
              </code>
            </div>
          ) : (
            <div className="text-[11px] text-slate-600 italic">No command set</div>
          )}
        </div>
      )}

      {/* Expanded config */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-800 pt-3">
          {/* Node label */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-medium">Label</label>
            <input
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[12px] text-slate-200 outline-none focus:border-violet-500 transition-colors"
              value={data.label || ''}
              onChange={e => update({ label: e.target.value })}
              placeholder="Run Build"
            />
          </div>

          {/* Machine selector */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-medium">
              Target Machine
            </label>
            {loadingMachines ? (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading machines…
              </div>
            ) : (
              <select
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[12px] text-slate-200 outline-none focus:border-violet-500 transition-colors"
                value={data.machineId || ''}
                onChange={e => {
                  const m = machines.find(x => x.id === e.target.value);
                  update({ machineId: e.target.value, machineName: m?.name });
                }}
              >
                <option value="">Select a machine…</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.isLive ? '● ' : '○ '}{m.name} {m.hostname ? `(${m.hostname})` : ''}
                  </option>
                ))}
              </select>
            )}
            {data.machineId && !loadingMachines && (
              <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnline
                  ? <><CheckCircle2 className="w-2.5 h-2.5" /> Online</>
                  : <><AlertCircle className="w-2.5 h-2.5" /> Offline — job will queue until machine connects</>
                }
              </div>
            )}
          </div>

          {/* Command */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-medium">
              Command
              <span className="ml-1 text-slate-600 font-normal">• use {'{{variable}}'} for interpolation</span>
            </label>
            <textarea
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[12px] text-slate-200 font-mono outline-none focus:border-violet-500 transition-colors resize-none"
              rows={3}
              value={data.command || ''}
              onChange={e => update({ command: e.target.value })}
              placeholder="xcodebuild clean build -scheme {{schemeName}} -destination 'generic/platform=iOS'"
            />
          </div>

          {/* Working directory */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-medium">
              Working Directory <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[12px] text-slate-200 font-mono outline-none focus:border-violet-500 transition-colors"
              value={data.cwd || ''}
              onChange={e => update({ cwd: e.target.value })}
              placeholder="~/Developer/MyApp"
            />
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-medium">
              <Clock className="inline w-3 h-3 mr-1" />Timeout
            </label>
            <select
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[12px] text-slate-200 outline-none focus:border-violet-500 transition-colors"
              value={data.timeoutMs ?? 300000}
              onChange={e => update({ timeoutMs: Number(e.target.value) })}
            >
              {DEFAULT_TIMEOUT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-600 bg-slate-800 text-violet-500"
                checked={data.captureOutput ?? true}
                onChange={e => update({ captureOutput: e.target.checked })}
              />
              <span className="text-[11px] text-slate-400">Pass output to next node</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-600 bg-slate-800 text-violet-500"
                checked={data.continueOnError ?? false}
                onChange={e => update({ continueOnError: e.target.checked })}
              />
              <span className="text-[11px] text-slate-400">Continue workflow on non-zero exit</span>
            </label>
          </div>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-violet-500 !border-violet-400"
      />
    </div>
  );
}

export default LocalShellNode;
