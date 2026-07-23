import React, { useState } from 'react';
import {
  Server,
  Zap,
  Sliders,
  Terminal,
  Check,
  Copy,
  Plus,
  RotateCcw,
  ShieldAlert,
  Radio,
  ExternalLink
} from 'lucide-react';
import { ApiMode, pebClient } from '../api/pebClient';

interface MockConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiMode: ApiMode;
  onModeChange: (mode: ApiMode) => void;
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
  onTriggerRefresh: () => void;
}

export const MockConfigModal: React.FC<MockConfigModalProps> = ({
  isOpen,
  onClose,
  apiMode,
  onModeChange,
  baseUrl,
  onBaseUrlChange,
  onTriggerRefresh
}) => {
  const [tempUrl, setTempUrl] = useState(baseUrl);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    pebClient.setBaseUrl(tempUrl);
    onBaseUrlChange(tempUrl);
  };

  const handleInjectViolation = () => {
    pebClient.injectMockEvent({
      receipt_id: `rcpt_inj_${Math.floor(100000 + Math.random() * 900000)}`,
      event_type: 'violation',
      plan_id: 'plan_nexus_001',
      agent_role: 'code_executor_role',
      work_request_id: 'wrk_999_manual',
      payload: {
        violation_type: 'UNAUTHORIZED_CAPABILITY_ACCESS',
        capability_attempted: 'exec:raw_sql',
        severity: 'CRITICAL',
        risk_score: 0.99,
        note: 'Manually injected test violation via IDE Mock Control'
      }
    });
    onTriggerRefresh();
  };

  const CURL_EXAMPLES = [
    { label: '1. Event Log Stream', cmd: `curl -N "${baseUrl}/api/peb/events/stream"` },
    { label: '2. Fetch Lineage', cmd: `curl "${baseUrl}/api/peb/transactions/tx_994a_102/lineage"` },
    { label: '3. Capability Gap', cmd: `curl "${baseUrl}/api/peb/entities/agent:runner-pod-99/capability-gap"` },
    { label: '4. Replay Event', cmd: `curl -X POST "${baseUrl}/api/peb/events/rcpt_1001/replay"` },
    { label: '5. State Diff', cmd: `curl "${baseUrl}/api/peb/state/governance.policy.v2/diff?from=tx_994a_080&to=current"` }
  ];

  const copyCurl = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCurl(label);
    setTimeout(() => setCopiedCurl(null), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none font-mono text-xs">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-3.5 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-zinc-100 text-sm">PEB-SRV MOCK SCHEME & API CONFIGURATION</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-sm font-bold px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* MODE TOGGLE SECTION */}
          <div className="p-3.5 rounded bg-zinc-900/80 border border-zinc-800 space-y-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              OPERATIONAL MODE SELECTOR
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  pebClient.setMode('mock');
                  onModeChange('mock');
                }}
                className={`p-3 rounded border text-left transition-all ${
                  apiMode === 'mock'
                    ? 'bg-amber-950/60 border-amber-600 text-amber-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>MOCK SCHEME ENGINE</span>
                  {apiMode === 'mock' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  In-memory generator with real-time SSE stream simulation, state diffing, & instant response.
                </p>
              </button>

              <button
                onClick={() => {
                  pebClient.setMode('live');
                  onModeChange('live');
                }}
                className={`p-3 rounded border text-left transition-all ${
                  apiMode === 'live'
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200 shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>LIVE PEB-SRV BACKEND</span>
                  {apiMode === 'live' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Connects directly to `peb-srv` running on PostgreSQL `nexus` database instance.
                </p>
              </button>
            </div>
          </div>

          {/* BACKEND URL INPUT */}
          <div className="p-3.5 rounded bg-zinc-900/80 border border-zinc-800 space-y-2">
            <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">
              PEB-SRV ENDPOINT URL (DEFAULT PORT 3111):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                placeholder="http://localhost:3111"
              />
              <button
                onClick={handleSaveUrl}
                className="px-3 py-1.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold hover:bg-emerald-900 transition-colors"
              >
                UPDATE URL
              </button>
            </div>
          </div>

          {/* MOCK INJECTION UTILITIES */}
          <div className="p-3.5 rounded bg-zinc-900/80 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              LIVE MOCK EVENT INJECTOR (TEST SSE STREAM)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInjectViolation}
                className="px-3 py-1.5 rounded bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Inject Test Capability Violation</span>
              </button>
            </div>
          </div>

          {/* CURL EXAMPLES */}
          <div className="p-3.5 rounded bg-zinc-900/80 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              REST API cURL SPECIFICATION SNIPPETS
            </span>
            <div className="space-y-1.5">
              {CURL_EXAMPLES.map((c) => (
                <div key={c.label} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-[10px]">
                  <span className="font-bold text-zinc-300">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-emerald-400 text-[9px] truncate max-w-xs">{c.cmd}</code>
                    <button
                      onClick={() => copyCurl(c.cmd, c.label)}
                      className="p-1 text-zinc-400 hover:text-zinc-100"
                    >
                      {copiedCurl === c.label ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-xs hover:bg-emerald-900 transition-colors"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
