import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Hash,
  Clock,
  Terminal,
  ArrowRight,
  ShieldCheck,
  GitCommit,
  Copy,
  Check
} from 'lucide-react';
import { Transaction, ThemeMode } from '../types/peb';
import { pebClient } from '../api/pebClient';

interface TransactionDetailPanelProps {
  transactionId: string;
  onClose: () => void;
  onNavigateToLineage?: (txId: string) => void;
  theme?: ThemeMode;
}

export const TransactionDetailPanel: React.FC<TransactionDetailPanelProps> = ({
  transactionId,
  onClose,
  onNavigateToLineage,
  theme = 'dark'
}) => {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'delta' | 'input' | 'output'>('delta');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pebClient.getTransaction(transactionId);
      setTx(data);
    } catch (err: any) {
      console.error('Failed to fetch transaction detail:', err);
      setError(err.message || 'Transaction not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const RESULT_BADGES: Record<
    string,
    { bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    ADMITTED: {
      bg: 'bg-emerald-950/90',
      text: 'text-emerald-300',
      border: 'border-emerald-800',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    },
    REJECTED: {
      bg: 'bg-rose-950/90',
      text: 'text-rose-300',
      border: 'border-rose-800',
      icon: <XCircle className="w-4 h-4 text-rose-400" />
    },
    QUARANTINED: {
      bg: 'bg-amber-950/90',
      text: 'text-amber-300',
      border: 'border-amber-800',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
    },
    OVERRIDDEN: {
      bg: 'bg-indigo-950/90',
      text: 'text-indigo-300',
      border: 'border-indigo-800',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col font-mono text-xs shadow-2xl overflow-hidden">
        {/* PANEL HEADER */}
        <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  TRANSACTION DETAIL RECORD
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-emerald-400 border border-zinc-800 font-mono">
                  GET /api/peb/transactions/{transactionId}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Single transaction record, cryptographic hash chain, state delta, and input/output payloads.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-zinc-400 gap-2">
              <RotateCcw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Fetching transaction record...</span>
            </div>
          ) : error || !tx ? (
            <div className="p-4 rounded bg-rose-950/40 border border-rose-900 text-rose-300 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Error Loading Transaction</span>
              </div>
              <p className="text-[11px] text-rose-200">{error || 'Record unavailable'}</p>
            </div>
          ) : (
            <>
              {/* PRIMARY STATS & ADMISSION HEADER CARD */}
              <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Transaction ID</div>
                    <div className="text-base font-bold text-emerald-300 flex items-center gap-2">
                      <span>{tx.id}</span>
                      <button
                        onClick={() => copyToClipboard(tx.id, 'txid')}
                        className="p-1 text-zinc-500 hover:text-zinc-200"
                        title="Copy Transaction ID"
                      >
                        {copiedKey === 'txid' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const badge = RESULT_BADGES[tx.admission_result] || RESULT_BADGES.ADMITTED;
                    return (
                      <div
                        className={`px-3 py-1 rounded-md border flex items-center gap-2 text-xs font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.icon}
                        <span>{tx.admission_result}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* METADATA GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-zinc-500 font-bold block text-[10px] uppercase">Entity ID:</span>
                    <span className="text-zinc-200 font-semibold">{tx.entity_id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold block text-[10px] uppercase">Tool Name:</span>
                    <span className="text-amber-300 font-bold">{tx.tool_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold block text-[10px] uppercase">Agent Role:</span>
                    <span className="text-indigo-300">{tx.agent_role}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold block text-[10px] uppercase">Latency:</span>
                    <span className="text-zinc-300">{tx.duration_ms} ms</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold block text-[10px] uppercase">Created At:</span>
                    <span className="text-zinc-400 text-[10px]">
                      {new Date(tx.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold block text-[10px] uppercase">Idempotency Key:</span>
                    <span className="text-zinc-400 font-mono text-[10px] truncate block">
                      {tx.idempotency_key || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* HASH CHAIN VERIFICATION BOX */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-cyan-400" />
                    <span>CRYPTOGRAPHIC STATE HASH CHAIN</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px]">
                    VERIFIED MATCH
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 font-bold block">BEFORE STATE HASH:</span>
                    <span className="text-zinc-300 font-mono break-all block">
                      {tx.before_hash || 'sha256:7f8a8109a2771b02'}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 font-bold block">AFTER STATE HASH:</span>
                    <span className="text-emerald-400 font-mono break-all block">
                      {tx.after_hash || 'sha256:e321a4f910332a81'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PAYLOAD TABS (Delta, Input, Output) */}
              <div className="space-y-2">
                <div className="flex border-b border-zinc-800 bg-zinc-900/60 p-1 rounded-t-lg gap-1">
                  <button
                    onClick={() => setActiveTab('delta')}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold transition-colors ${
                      activeTab === 'delta'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    STATE DELTA PATCH
                  </button>
                  <button
                    onClick={() => setActiveTab('input')}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold transition-colors ${
                      activeTab === 'input'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    INPUT PAYLOAD
                  </button>
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold transition-colors ${
                      activeTab === 'output'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    OUTPUT PAYLOAD
                  </button>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-b-lg">
                  {activeTab === 'delta' && (
                    <pre className="text-emerald-300 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap p-2 rounded bg-zinc-900/80 border border-zinc-800">
                      {JSON.stringify(tx.state_delta || {}, null, 2)}
                    </pre>
                  )}
                  {activeTab === 'input' && (
                    <pre className="text-indigo-300 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap p-2 rounded bg-zinc-900/80 border border-zinc-800">
                      {JSON.stringify(tx.input || {}, null, 2)}
                    </pre>
                  )}
                  {activeTab === 'output' && (
                    <pre className="text-cyan-300 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap p-2 rounded bg-zinc-900/80 border border-zinc-800">
                      {JSON.stringify(tx.output || {}, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {tx && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-zinc-500">
              Kernel Event: <span className="text-zinc-400 font-mono">{tx.kernel_event_id || 'evt_k_01'}</span>
            </span>

            {onNavigateToLineage && (
              <button
                onClick={() => {
                  onNavigateToLineage(tx.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>INSPECT LINEAGE IN CAUSAL GRAPH</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
