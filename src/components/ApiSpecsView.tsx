import React, { useState } from 'react';
import {
  Terminal,
  BookOpen,
  Sliders,
  Play,
  RotateCcw,
  Check,
  Copy,
  Zap,
  Code2,
  ShieldCheck,
  FileJson
} from 'lucide-react';
import { ApiMode, pebClient } from '../api/pebClient';
import { ThemeMode } from '../types/peb';

interface ApiSpecsViewProps {
  theme: ThemeMode;
  density: 'compact' | 'normal';
  apiMode: ApiMode;
  onOpenMockConfig: () => void;
}

export const ApiSpecsView: React.FC<ApiSpecsViewProps> = ({
  theme,
  density,
  apiMode,
  onOpenMockConfig
}) => {
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  const testCall = async (endpointName: string, callFn: () => Promise<any>) => {
    setTestingEndpoint(endpointName);
    try {
      const res = await callFn();
      setTestResponse({ endpoint: endpointName, success: true, data: res });
    } catch (err) {
      setTestResponse({ endpoint: endpointName, success: false, error: (err as Error).message });
    } finally {
      setTestingEndpoint(null);
    }
  };

  const ENDPOINTS = [
    {
      group: '1. Event Stream',
      items: [
        { method: 'GET', path: '/health', desc: 'Service-level health + counts', test: () => pebClient.getHealth() },
        { method: 'GET', path: '/api/peb/events', desc: 'Cursor-paginated log tail (`since` cursor)', test: () => pebClient.getEvents({ limit: 10 }) },
        { method: 'POST', path: '/api/peb/events/{receipt_id}/replay', desc: 'Stamp replayed_at, push replay SSE event', test: () => pebClient.replayEvent('rcpt_1001') },
        { method: 'GET', path: '/api/peb/events/stream', desc: 'SSE live stream + poll loop', test: () => Promise.resolve({ status: 'SSE stream connection active' }) }
      ]
    },
    {
      group: '2. Causal Graph & Lineage',
      items: [
        { method: 'GET', path: '/api/peb/transactions', desc: 'List transactions (newest first)', test: () => pebClient.getTransactions() },
        { method: 'GET', path: '/api/peb/transactions/{id}/lineage', desc: 'Causal graph in one payload', test: () => pebClient.getLineage('tx_994a_102') },
        { method: 'GET', path: '/api/peb/decisions/{id}/chain', desc: 'Walks parent_decision_id or rollback_of', test: () => pebClient.getDecisionChain('dec_8813_rollback') },
        { method: 'GET', path: '/api/peb/traces/{id}/tree', desc: 'Recursive descendants of trace with rejected alternatives', test: () => pebClient.getTraceTree('trc_nexus_7721') },
        { method: 'GET', path: '/api/peb/entities/{id}/capability-gap', desc: 'As-of overlay of capabilities grants against violations', test: () => pebClient.getCapabilityGap('agent:runner-pod-99') }
      ]
    },
    {
      group: '3. Rollup / Fleet Health',
      items: [
        { method: 'GET', path: '/api/peb/health/circuit-breakers', desc: 'All roles, tripped-first', test: () => pebClient.getCircuitBreakers() },
        { method: 'GET', path: '/api/peb/health/violations/summary', desc: 'Rolling window rollup', test: () => pebClient.getViolationsSummary('24h') },
        { method: 'GET', path: '/api/peb/health/entropy', desc: 'Counts + per-day trend', test: () => pebClient.getEntropy('entropy_class', '14d') }
      ]
    },
    {
      group: '4. State Diffing',
      items: [
        { method: 'GET', path: '/api/peb/state/{key}/versions', desc: 'All transactions touching key + peb.state current row', test: () => pebClient.getStateVersions('governance.policy.v2') },
        { method: 'GET', path: '/api/peb/state/{key}/diff', desc: 'Replay state_delta patches for key and diff', test: () => pebClient.getStateDiff('governance.policy.v2', 'tx_994a_080', 'current') }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden">
      {/* HEADER */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>PEB-SRV OBSERVABILITY API SPEC & MOCK ENGINE TESTER</span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Test endpoints live against Mock Scheme or real `peb-srv` service.
          </p>
        </div>

        <button
          onClick={onOpenMockConfig}
          className="px-3 py-1.5 rounded bg-amber-950 border border-amber-700 hover:bg-amber-900 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>CONFIGURE MOCK SCHEME</span>
        </button>
      </div>

      {/* MAIN SPLIT VIEW */}
      <div className="flex-1 flex overflow-hidden">
        {/* ENDPOINT LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {ENDPOINTS.map((group) => (
            <div key={group.group} className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
                {group.group}
              </div>

              <div className="space-y-1.5">
                {group.items.map((ep) => (
                  <div
                    key={ep.path}
                    className="p-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ep.method === 'GET' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="font-bold text-zinc-100 font-mono">{ep.path}</span>
                      <span className="text-zinc-500 text-[10px] truncate">{ep.desc}</span>
                    </div>

                    <button
                      onClick={() => testCall(`${ep.method} ${ep.path}`, ep.test)}
                      disabled={testingEndpoint === `${ep.method} ${ep.path}`}
                      className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-300 text-zinc-300 font-bold text-[10px] flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Play className={`w-3 h-3 ${testingEndpoint === `${ep.method} ${ep.path}` ? 'animate-spin text-emerald-400' : ''}`} />
                      <span>TEST</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RESPONSE TEST CONSOLE */}
        <div className="w-96 border-l border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between overflow-y-auto shrink-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-400 text-xs uppercase">INTERACTIVE API TEST CONSOLE</span>
              </div>
              <span className="text-[10px] text-zinc-500">{apiMode.toUpperCase()} MODE</span>
            </div>

            {testResponse ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-bold">Tested Endpoint:</span>
                  <span className="text-emerald-300 font-mono font-bold">{testResponse.endpoint}</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">Status:</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded ${
                    testResponse.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {testResponse.success ? '200 OK' : 'ERROR'}
                  </span>
                </div>

                <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                  Raw JSON Response Body:
                </span>
                <pre className="p-3 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 text-[10px] overflow-x-auto leading-relaxed max-h-96">
                  {JSON.stringify(testResponse.data || testResponse.error, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-6 rounded bg-zinc-900/60 border border-zinc-800 text-center text-zinc-500 space-y-2">
                <Code2 className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-[11px]">Click "TEST" on any endpoint on the left to inspect raw REST API response JSON.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 text-[10px] text-zinc-500">
            Supports both Mock Scheme Engine and Live `peb-srv` REST API proxies.
          </div>
        </div>
      </div>
    </div>
  );
};
