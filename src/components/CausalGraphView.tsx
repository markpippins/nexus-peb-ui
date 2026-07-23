import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitBranch,
  Network,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Percent,
  XCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import {
  Transaction,
  LineagePayload,
  DecisionChainNode,
  TraceTreeNode,
  ThemeMode
} from '../types/peb';
import { pebClient } from '../api/pebClient';

interface CausalGraphViewProps {
  theme: ThemeMode;
  density: 'compact' | 'normal';
}

export const CausalGraphView: React.FC<CausalGraphViewProps> = ({ theme, density }) => {
  const [subTab, setSubTab] = useState<'lineage' | 'decisions' | 'trace'>('lineage');
  const [selectedTxId, setSelectedTxId] = useState<string>('tx_994a_102');
  const [lineage, setLineage] = useState<LineagePayload | null>(null);
  const [decisions, setDecisions] = useState<DecisionChainNode[]>([]);
  const [decisionDirection, setDecisionDirection] = useState<'ancestry' | 'rollback'>('ancestry');
  const [traceTree, setTraceTree] = useState<TraceTreeNode | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'lineage') {
        const data = await pebClient.getLineage(selectedTxId);
        setLineage(data);
      } else if (subTab === 'decisions') {
        const data = await pebClient.getDecisionChain('dec_8813_rollback', decisionDirection);
        setDecisions(data);
      } else if (subTab === 'trace') {
        const data = await pebClient.getTraceTree('trc_nexus_7721');
        setTraceTree(data);
      }
    } catch (err) {
      console.error('Error loading causal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, selectedTxId, decisionDirection]);

  // Helper component for Recursive Trace Tree Node
  const RenderTraceNode: React.FC<{ node: TraceTreeNode; depth?: number }> = ({ node, depth = 0 }) => {
    const [expanded, setExpanded] = useState(true);

    const confidenceColor =
      node.confidence > 0.8
        ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
        : node.confidence > 0.5
        ? 'text-amber-400 bg-amber-950/80 border-amber-800'
        : 'text-rose-400 bg-rose-950/80 border-rose-800';

    return (
      <div className="ml-4 pl-3 border-l-2 border-zinc-800 my-2 space-y-2">
        <div className="flex items-start justify-between gap-3 p-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-2 min-w-0">
            {node.children && node.children.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-0.5 text-zinc-500 hover:text-zinc-200"
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-100">{node.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${confidenceColor}`}>
                  {Math.round(node.confidence * 100)}% CONFIDENCE
                </span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {node.duration_ms}ms
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                Trace ID: <span className="text-emerald-400">{node.trace_id}</span> | Node: <span className="text-zinc-300">{node.id}</span>
              </div>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              node.status === 'SUCCESS'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {node.status}
          </span>
        </div>

        {/* REJECTED ALTERNATIVES */}
        {node.rejected_alternatives && node.rejected_alternatives.length > 0 && (
          <div className="ml-6 p-2 rounded bg-rose-950/30 border border-rose-900/60 text-[10px] space-y-1">
            <div className="text-rose-300 font-bold flex items-center gap-1 uppercase tracking-wider text-[9px]">
              <XCircle className="w-3 h-3 text-rose-400" />
              <span>REJECTED ALTERNATIVE OPTIONS (GOVERNANCE EVALUATION)</span>
            </div>
            {node.rejected_alternatives.map((alt, idx) => (
              <div key={idx} className="flex items-start justify-between text-rose-200/90 pl-2 border-l border-rose-800">
                <div>
                  <span className="font-bold text-rose-300">{alt.option}: </span>
                  <span className="italic">{alt.reason}</span>
                </div>
                <span className="text-[9px] text-rose-400 font-mono">score: {alt.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* RECURSIVE CHILDREN */}
        {expanded && node.children && (
          <div className="space-y-1">
            {node.children.map((child) => (
              <RenderTraceNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden">
      {/* HEADER & SUB-TABS */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-400" />
            <span>CAUSAL GRAPH & TRACE TREE EXPLORER</span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Explore transaction lineage, decision ancestry chains, trace hierarchies, and governance event timelines.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SUB TAB NAVIGATION */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/80 px-3 gap-2 shrink-0">
        <button
          onClick={() => setSubTab('lineage')}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            subTab === 'lineage'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>TRANSACTION LINEAGE</span>
        </button>

        <button
          onClick={() => setSubTab('decisions')}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            subTab === 'decisions'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>DECISION ANCESTRY / ROLLBACK CHAIN</span>
        </button>

        <button
          onClick={() => setSubTab('trace')}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            subTab === 'trace'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>RECURSIVE TRACE TREE</span>
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* SUBTAB 1: TRANSACTION LINEAGE */}
        {subTab === 'lineage' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded border border-zinc-800">
              <span className="text-zinc-400 font-bold text-[10px] uppercase">Select Target Transaction ID:</span>
              <select
                value={selectedTxId}
                onChange={(e) => setSelectedTxId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="tx_994a_102">tx_994a_102 (code_executor_role)</option>
                <option value="tx_994a_101">tx_994a_101 (db_migration_agent)</option>
                <option value="tx_994a_100">tx_994a_100 (security_policy_enforcer)</option>
              </select>
            </div>

            {lineage && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Transaction Box */}
                  <div className="p-3.5 rounded bg-zinc-950 border border-emerald-800/80 space-y-2">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                      <span>PRIMARY TRANSACTION UNDER TEST</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {lineage.transaction.admission_result}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-zinc-100 font-mono">{lineage.transaction.id}</div>
                    <div className="text-zinc-400 text-[11px] space-y-1">
                      <div>Entity: <span className="text-zinc-200">{lineage.transaction.entity_id}</span></div>
                      <div>Tool Executed: <span className="text-amber-300 font-bold">{lineage.transaction.tool_name}</span></div>
                      <div>Role: <span className="text-indigo-300">{lineage.transaction.agent_role}</span></div>
                      <div>Duration: <span className="text-zinc-300">{lineage.transaction.duration_ms}ms</span></div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">State Delta Patch:</span>
                      <pre className="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 text-[10px] overflow-x-auto">
                        {JSON.stringify(lineage.transaction.state_delta, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Capabilities Checked & Violations Raised */}
                  <div className="space-y-4">
                    <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        CAPABILITIES CHECKED AT ADMISSION
                      </div>
                      {lineage.capabilities_checked.map((cap) => (
                        <div key={cap.id} className="p-2 rounded bg-cyan-950/30 border border-cyan-800/60 text-cyan-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold">{cap.capability}</div>
                            <div className="text-[9px] text-cyan-400">Granted by: {cap.granted_by}</div>
                          </div>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            ACTIVE
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded bg-zinc-950 border border-rose-900/80 space-y-2">
                      <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>VIOLATIONS RAISED BY TRANSACTION</span>
                      </div>
                      {lineage.violations_raised.map((v) => (
                        <div key={v.id} className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-rose-300">{v.violation_type}</div>
                            <div className="text-[9px] text-rose-400">Attempted: {v.capability_attempted}</div>
                          </div>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            {v.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ENRICHED SECTION: LINEAGE TRACE HIERARCHY */}
                {lineage.traces_tree && lineage.traces_tree.length > 0 && (
                  <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-300 uppercase text-xs">
                          EXECUTION TRACE HIERARCHY (`lineage.traces_tree`)
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {lineage.traces_tree.length} Root Traces
                      </span>
                    </div>

                    <div className="space-y-2">
                      {lineage.traces_tree.map((node) => (
                        <div key={node.id} className="p-3 rounded bg-zinc-900/80 border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-100">{node.stage.toUpperCase()}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                              CONFIDENCE: {Math.round(node.confidence * 100)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            Trace ID: <span className="text-emerald-400">{node.id}</span> | Work Request: <span className="text-indigo-300">{node.work_request_id}</span>
                          </div>

                          {node.children && node.children.length > 0 && (
                            <div className="pl-3 border-l-2 border-emerald-800/60 mt-2 space-y-2">
                              {node.children.map((child) => (
                                <div key={child.id} className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[10px]">
                                  <div className="flex items-center justify-between font-bold text-amber-300">
                                    <span>➔ Stage: {child.stage}</span>
                                    <span className="text-emerald-400">{Math.round(child.confidence * 100)}%</span>
                                  </div>
                                  {child.rejected_alternatives && child.rejected_alternatives.length > 0 && (
                                    <div className="mt-1 text-rose-300/80 italic text-[9px]">
                                      Rejected: {child.rejected_alternatives.map(a => `${a.option || a.stage} (${a.reason})`).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ENRICHED SECTION: GOVERNANCE TIMELINE */}
                {lineage.governance_events && lineage.governance_events.length > 0 && (
                  <div className="p-4 rounded bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-indigo-300 uppercase text-xs">
                        GOVERNANCE EVENTS TIMELINE (`lineage.governance_events`)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {lineage.governance_events.map((evt) => (
                        <div key={evt.id} className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-start justify-between text-[10px]">
                          <div>
                            <div className="font-bold text-zinc-200">{evt.event_type}</div>
                            <div className="text-zinc-400 text-[9px] mt-0.5">Author: <span className="text-indigo-300">{evt.author_id}</span></div>
                          </div>
                          <span className="text-zinc-500 text-[9px]">{new Date(evt.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: DECISION ANCESTRY & ROLLBACK CHAIN */}
        {subTab === 'decisions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded border border-zinc-800">
              <span className="text-zinc-400 font-bold text-[10px] uppercase">Chain Direction:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDecisionDirection('ancestry')}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                    decisionDirection === 'ancestry'
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  ANCESTRY PARENTS
                </button>
                <button
                  onClick={() => setDecisionDirection('rollback')}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                    decisionDirection === 'rollback'
                      ? 'bg-rose-950 border-rose-700 text-rose-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  ROLLBACK OF
                </button>
              </div>
            </div>

            {/* Decision Nodes Chain View */}
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-zinc-800">
              {decisions.map((node, idx) => (
                <div key={node.id} className="relative pl-12">
                  {/* Node Circle */}
                  <div className="absolute left-4 top-3 w-4 h-4 rounded-full bg-emerald-500 border-4 border-zinc-950 shadow-sm"></div>

                  <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 hover:border-emerald-800 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 text-sm">{node.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-700 text-indigo-300">
                        ENTROPY: {node.entropy_class}
                      </span>
                    </div>

                    <div className="text-zinc-200 font-semibold text-xs">{node.summary}</div>
                    <div className="text-zinc-400 italic text-[11px] bg-zinc-900/60 p-2 rounded border border-zinc-800">
                      "{node.rationale}"
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                      <span>Author: <span className="text-zinc-300">{node.author_id}</span></span>
                      <span>{new Date(node.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: RECURSIVE TRACE TREE */}
        {subTab === 'trace' && traceTree && (
          <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
              <span className="font-bold text-emerald-400 uppercase text-xs">
                RECURSIVE DESCENDANTS TREE (`/traces/{traceTree.trace_id}/tree`)
              </span>
              <span className="text-[10px] text-zinc-500">Root Trace Node</span>
            </div>

            <RenderTraceNode node={traceTree} />
          </div>
        )}
      </div>
    </div>
  );
};
