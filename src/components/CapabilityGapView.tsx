import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Filter,
  UserCheck,
  Search,
  Info
} from 'lucide-react';
import { CapabilityGapItem, GapStatus, ThemeMode } from '../types/peb';
import { pebClient } from '../api/pebClient';

interface CapabilityGapViewProps {
  theme: ThemeMode;
  density: 'compact' | 'normal';
  initialEntityId?: string;
}

export const CapabilityGapView: React.FC<CapabilityGapViewProps> = ({
  theme,
  density,
  initialEntityId = 'agent:runner-pod-99'
}) => {
  const [entityId, setEntityId] = useState<string>(initialEntityId);
  const [gapItems, setGapItems] = useState<CapabilityGapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CapabilityGapItem | null>(null);

  const fetchCapabilityGap = async () => {
    setLoading(true);
    try {
      const data = await pebClient.getCapabilityGap(entityId);
      setGapItems(data);
    } catch (err) {
      console.error('Error fetching capability gap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapabilityGap();
  }, [entityId]);

  const pyClass = density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3.5';

  const filteredItems = gapItems.filter((item) => {
    if (!statusFilter) return true;
    return item.gap_status === statusFilter;
  });

  const STATUS_BADGES: Record<GapStatus, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
    active: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-800',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'ACTIVE GRANT (DELIBERATE OVERSTEP)'
    },
    lapsed: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      label: 'LAPSED / EXPIRED GRANT'
    },
    missing: {
      bg: 'bg-rose-950/80',
      text: 'text-rose-300',
      border: 'border-rose-800',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
      label: 'MISSING GRANT (NEVER GRANTED)'
    }
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden">
      {/* HEADER */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>CAPABILITY-GAP OVERLAY ANALYSIS</span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            As-of overlay of `peb.capabilities` grants against `peb.violations.capability_attempted`.
          </p>
        </div>

        <button
          onClick={fetchCapabilityGap}
          className="p-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* FILTER & ENTITY INPUT */}
      <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-zinc-400 font-semibold uppercase text-[10px]">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TARGET ENTITY ID:</span>
          </div>

          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="agent:runner-pod-99">agent:runner-pod-99</option>
            <option value="agent:db-migrator-01">agent:db-migrator-01</option>
            <option value="agent:release-agent">agent:release-agent</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase">GAP STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active (Deliberate overstep)</option>
            <option value="lapsed">Lapsed (Expired grant)</option>
            <option value="missing">Missing (Never granted)</option>
          </select>
        </div>
      </div>

      {/* LEGEND EXPLANATION BANNER */}
      <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0">
        <div className="flex items-center gap-2 p-1.5 rounded bg-emerald-950/40 border border-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-emerald-300 font-bold">active:</span> Grant existed at attempt moment (deliberate overstep).
          </div>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded bg-amber-950/40 border border-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-amber-300 font-bold">lapsed:</span> Grant existed previously, but expired before attempt.
          </div>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded bg-rose-950/40 border border-rose-900">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <span className="text-rose-300 font-bold">missing:</span> No grant ever existed for entity + capability.
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-semibold">
            <tr>
              <th className={pyClass}>ENTITY ID</th>
              <th className={pyClass}>CAPABILITY ATTEMPTED</th>
              <th className={pyClass}>GAP STATUS</th>
              <th className={pyClass}>VIOLATION ID</th>
              <th className={pyClass}>VIOLATION TIMESTAMP</th>
              <th className={pyClass}>EXPLANATION NOTES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {filteredItems.map((item, idx) => {
              const badge = STATUS_BADGES[item.gap_status];
              return (
                <tr
                  key={idx}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-zinc-900/80 cursor-pointer transition-colors"
                >
                  <td className={`${pyClass} font-bold text-emerald-300`}>{item.entity_id}</td>
                  <td className={`${pyClass} font-mono font-bold text-zinc-100`}>{item.capability_attempted}</td>
                  <td className={pyClass}>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                      {badge.icon}
                      <span>{item.gap_status.toUpperCase()}</span>
                    </span>
                  </td>
                  <td className={`${pyClass} text-rose-400 font-mono`}>{item.violation_id}</td>
                  <td className={`${pyClass} text-zinc-500 text-[10px]`}>
                    {new Date(item.violation_created_at).toLocaleString()}
                  </td>
                  <td className={`${pyClass} text-zinc-400 italic truncate max-w-xs`}>{item.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DETAILED INSPECTION MODAL / DRAWER */}
      {selectedItem && (
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold text-emerald-400 text-xs">
              CAPABILITY GAP OVERLAY DETAILS FOR `{selectedItem.capability_attempted}`
            </span>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-zinc-500 hover:text-zinc-200 font-bold px-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
            <div className="space-y-1">
              <div className="text-zinc-400 font-bold">Target Entity: <span className="text-emerald-300">{selectedItem.entity_id}</span></div>
              <div className="text-zinc-400">Violation Record: <span className="text-rose-400">{selectedItem.violation_id}</span></div>
              <div className="text-zinc-400">Evaluation Timestamp: <span className="text-zinc-200">{new Date(selectedItem.violation_created_at).toLocaleString()}</span></div>
              <div className="text-zinc-300 mt-2 p-2 rounded bg-zinc-900 border border-zinc-800">
                {selectedItem.notes}
              </div>
            </div>

            {selectedItem.matching_grant ? (
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="text-cyan-400 font-bold text-[10px] uppercase">MATCHING HISTORICAL GRANT RECORD:</div>
                <div className="text-zinc-300">Grant ID: {selectedItem.matching_grant.id}</div>
                <div className="text-zinc-300">Granted By: {selectedItem.matching_grant.granted_by}</div>
                <div className="text-zinc-300">Created: {new Date(selectedItem.matching_grant.created_at).toLocaleString()}</div>
                <div className="text-zinc-300">
                  Expires: {selectedItem.matching_grant.expires_at ? new Date(selectedItem.matching_grant.expires_at).toLocaleString() : 'Never'}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded bg-rose-950/30 border border-rose-900 text-rose-300 space-y-1 flex items-center gap-2">
                <Info className="w-5 h-5 text-rose-400 shrink-0" />
                <span>No historical capability grant matching this attempt was ever found in `peb.capabilities`.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
