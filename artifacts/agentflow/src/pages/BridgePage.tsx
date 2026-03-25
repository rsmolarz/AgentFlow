/**
 * Bridge Settings Page
 * 
 * File: artifacts/agentflow/src/pages/BridgePage.tsx
 * 
 * Add to your router:
 *   import BridgePage from './pages/BridgePage';
 *   <Route path="/bridge" component={BridgePage} />
 * 
 * Add to your nav (sidebar):
 *   { label: 'Local Bridge', icon: Monitor, path: '/bridge' }
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor, Plus, Trash2, Copy, Check, RefreshCw,
  Wifi, WifiOff, Terminal, Clock, Key, AlertCircle
} from 'lucide-react';

interface BridgeMachine {
  id: string;
  name: string;
  apiKeyPrefix: string;
  machineId: string;
  hostname?: string;
  platform?: string;
  arch?: string;
  status: 'online' | 'offline';
  isLive: boolean;
  lastSeenAt?: string;
  createdAt: string;
  isEnabled: boolean;
}

interface NewMachineResult extends BridgeMachine {
  apiKey: string;
}

export default function BridgePage() {
  const [machines, setMachines] = useState<BridgeMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<NewMachineResult | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/bridge/machines');
    const data = await res.json();
    setMachines(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 10s to update online status
  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  async function createMachine() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/bridge/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data: NewMachineResult = await res.json();
      setNewKeyResult(data);
      setNewName('');
      setShowCreateForm(false);
      load();
    } finally {
      setCreating(false);
    }
  }

  async function deleteMachine(id: string, name: string) {
    if (!confirm(`Remove "${name}"? Any workflows using this machine will stop working.`)) return;
    await fetch(`/api/bridge/machines/${id}`, { method: 'DELETE' });
    load();
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatLastSeen(ts?: string): string {
    if (!ts) return 'Never';
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Local Bridge</h1>
              <p className="text-sm text-slate-500">Run shell commands on your local Mac from AgentFlow workflows</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Machine
          </button>
        </div>
      </div>

      {/* New API Key display (shown once after creation) */}
      {newKeyResult && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-emerald-300 mb-1">
                Machine "{newKeyResult.name}" created — save your API key now!
              </div>
              <p className="text-sm text-emerald-500 mb-3">
                This key will never be shown again. Copy it and paste it into the AgentFlow Bridge app on your Mac.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-emerald-300 text-sm font-mono border border-slate-700 truncate">
                  {newKeyResult.apiKey}
                </code>
                <button
                  onClick={() => copyKey(newKeyResult.apiKey)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewKeyResult(null)}
              className="text-emerald-600 hover:text-emerald-400 text-lg leading-none flex-shrink-0"
            >✕</button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-200 mb-3">New Bridge Machine</h3>
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm outline-none focus:border-violet-500 transition-colors"
              placeholder="My MacBook Pro"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createMachine();
                if (e.key === 'Escape') setShowCreateForm(false);
              }}
            />
            <button
              onClick={createMachine}
              disabled={!newName.trim() || creating}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Machine list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading machines…
        </div>
      ) : machines.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-slate-300 font-medium mb-2">No machines yet</h3>
          <p className="text-slate-500 text-sm mb-4">
            Add a machine and install the Bridge app on your Mac to get started.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Add Your First Machine
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {machines.map(machine => (
            <div
              key={machine.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
                  machine.isLive ? 'bg-emerald-400 shadow-emerald-400/40 shadow-md' : 'bg-slate-600'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-slate-200">{machine.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      machine.isLive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {machine.isLive ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    {machine.hostname && (
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />{machine.hostname}
                      </span>
                    )}
                    {machine.platform && (
                      <span>{machine.platform} {machine.arch}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      <code>{machine.apiKeyPrefix}…</code>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last seen {formatLastSeen(machine.lastSeenAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteMachine(machine.id, machine.name)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                  title="Remove machine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup guide */}
      <div className="mt-10 p-5 rounded-xl bg-slate-900/40 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500" />
          Setup Guide
        </h3>
        <ol className="space-y-2 text-sm text-slate-500">
          <li className="flex gap-2"><span className="text-slate-600 font-mono">1.</span> Download and install <strong className="text-slate-400">AgentFlow Bridge.app</strong> on your Mac</li>
          <li className="flex gap-2"><span className="text-slate-600 font-mono">2.</span> Click <strong className="text-slate-400">Add Machine</strong> above and enter a name for your Mac</li>
          <li className="flex gap-2"><span className="text-slate-600 font-mono">3.</span> Copy the generated API key</li>
          <li className="flex gap-2"><span className="text-slate-600 font-mono">4.</span> Open the Bridge app (⚡ in your menu bar) → Settings → paste the API key</li>
          <li className="flex gap-2"><span className="text-slate-600 font-mono">5.</span> Your machine will appear as <strong className="text-slate-400">Online</strong> above</li>
          <li className="flex gap-2"><span className="text-slate-600 font-mono">6.</span> Add a <strong className="text-slate-400">Local Shell</strong> node to any workflow and select your machine</li>
        </ol>
      </div>
    </div>
  );
}
