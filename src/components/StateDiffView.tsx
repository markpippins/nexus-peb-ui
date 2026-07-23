import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  RotateCcw,
  History,
  PlusCircle,
  MinusCircle,
  Edit3,
  Database,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { StateVersion, StateDiff, ThemeMode } from '../types/peb';
import { pebClient } from '../api/pebClient';

interface StateDiffViewProps {
  theme: ThemeMode;
  density: 'compact' | 'normal';
}

export const StateDiffView: React.FC<StateDiffViewProps> = ({ theme, density }) => {
  const [selectedKey, setSelectedKey] = useState<string>('governance.policy.v2');
  const [versions, setVersions] = useState<StateVersion[]>([]);
  const [currentValue, setCurrentValue] = useState<any>(null);
  const [fromTxId, setFromTxId] = useState<string>('tx_994a_080');
  const [toTxId, setToTxId] = useState<string>('current');
  const [diff, setDiff] = useState<StateDiff | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVersionsAndDiff = async () => {
    setLoading(true);
    try {
      const vData = await pebClient.getStateVersions(selectedKey);
      setVersions(vData.versions);
      setCurrentValue(vData.current);

      if (vData.versions.length >= 2 && !fromTxId) {
        setFromTxId(vData.versions[0].tx_id);
      }

      const dData = await pebClient.getStateDiff(selectedKey, fromTxId || 'tx_994a_080', toTxId);
      setDiff(dData);
    } catch (err) {
      console.error('Error fetching state versions/diff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersionsAndDiff();
  }, [selectedKey, fromTxId, toTxId]);

  const pyClass = density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3.5';

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden">
      {/* HEADER */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            <span>STATE HISTORY REPLAY & PATCH DIFFING</span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Replays `transactions.state_delta` history against `peb.state` ledger.
          </p>
        </div>

        <button
          onClick={fetchVersionsAndDiff}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KEY SELECTOR & COMPARISON BAR */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-zinc-400 font-bold uppercase text-[10px]">STATE KEY:</span>
          <select
            value={selectedKey}
            onChange={(e) => {
              setSelectedKey(e.target.value);
              setFromTxId('tx_994a_080');
              setToTxId('current');
            }}
            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="governance.policy.v2">governance.policy.v2</option>
            <option value="agent.context.env">agent.context.env</option>
            <option value="capability.matrix.core">capability.matrix.core</option>
          </select>
        </div>

        {/* FROM vs TO Transaction Selectors */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 font-bold">FROM TX:</span>
          <select
            value={fromTxId}
            onChange={(e) => setFromTxId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-amber-300 font-mono focus:outline-none focus:border-emerald-500"
          >
            {versions.map((v) => (
              <option key={v.tx_id} value={v.tx_id}>
                v{v.version} ({v.tx_id})
              </option>
            ))}
          </select>

          <ArrowRight className="w-4 h-4 text-zinc-500" />

          <span className="text-[10px] text-zinc-400 font-bold">TO TX:</span>
          <select
            value={toTxId}
            onChange={(e) => setToTxId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="current">current (`peb.state` live)</option>
            {versions.map((v) => (
              <option key={v.tx_id} value={v.tx_id}>
                v{v.version} ({v.tx_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SPLIT VIEW AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: VERSION TIMELINE */}
        <div className="w-72 border-r border-zinc-800 bg-zinc-950 p-3 overflow-y-auto shrink-0 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
            <span>VERSION HISTORY (`peb.transactions`)</span>
            <History className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.version}
                className={`p-2.5 rounded border transition-colors ${
                  fromTxId === v.tx_id || toTxId === v.tx_id
                    ? 'bg-emerald-950/40 border-emerald-800'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400">Version {v.version}</span>
                  <span className="text-amber-300 text-[10px]">{v.tx_id}</span>
                </div>
                <div className="text-[10px] text-zinc-300 mt-1 font-semibold">{v.delta_summary}</div>
                <div className="text-[9px] text-zinc-500 mt-1">
                  Author: {v.author_id} | {new Date(v.created_at).toLocaleTimeString()}
                </div>
                <div className="text-[9px] text-zinc-600 font-mono mt-0.5 truncate">
                  {v.checksum}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: DIFF COMPARISON DISPLAY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {diff && (
            <div className="space-y-4">
              {/* Diff Summary Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded bg-emerald-950/30 border border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-emerald-300">Added Keys</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    {Object.keys(diff.added).length}
                  </span>
                </div>

                <div className="p-3 rounded bg-rose-950/30 border border-rose-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MinusCircle className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-rose-300">Removed Keys</span>
                  </div>
                  <span className="text-lg font-bold text-rose-400">
                    {Object.keys(diff.removed).length}
                  </span>
                </div>

                <div className="p-3 rounded bg-amber-950/30 border border-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-300">Changed Values</span>
                  </div>
                  <span className="text-lg font-bold text-amber-400">
                    {Object.keys(diff.changed).length}
                  </span>
                </div>
              </div>

              {/* Side by Side Diff Viewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FROM VALUE JSON */}
                <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span>FROM: {diff.from_tx_id}</span>
                    <span className="text-zinc-500">SNAPSHOT VALUE</span>
                  </div>
                  <pre className="p-3 rounded bg-zinc-900 border border-zinc-800 text-amber-300 text-[11px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(diff.from_value, null, 2)}
                  </pre>
                </div>

                {/* TO VALUE JSON */}
                <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>TO: {diff.to_tx_id}</span>
                    <span className="text-zinc-500">SNAPSHOT VALUE</span>
                  </div>
                  <pre className="p-3 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 text-[11px] overflow-x-auto leading-relaxed">
                    {JSON.stringify(diff.to_value, null, 2)}
                  </pre>
                </div>
              </div>

              {/* DETAILED PATCH CHANGES BREAKDOWN */}
              <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">
                  FIELD-LEVEL JSON PATCH DELTA
                </div>

                {Object.entries(diff.changed).map(([k, val]) => {
                  const changeVal = val as { from: any; to: any };
                  return (
                    <div key={k} className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                      <span className="font-bold text-zinc-100 font-mono">{k}:</span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 line-through">
                          {JSON.stringify(changeVal?.from)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          {JSON.stringify(changeVal?.to)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
