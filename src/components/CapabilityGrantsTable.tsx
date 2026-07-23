import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  UserCheck,
  Key,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CapabilityGrant, ThemeMode } from '../types/peb';
import { pebClient } from '../api/pebClient';

interface CapabilityGrantsTableProps {
  entityId: string;
  theme: ThemeMode;
  density: 'compact' | 'normal';
}

export const CapabilityGrantsTable: React.FC<CapabilityGrantsTableProps> = ({
  entityId,
  theme,
  density
}) => {
  const [grants, setGrants] = useState<CapabilityGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const data = await pebClient.getCapabilities(entityId);
      setGrants(data);
    } catch (err) {
      console.error('Error fetching capability grants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, [entityId]);

  const pyClass = density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3.5';

  const filteredGrants = grants.filter((g) => {
    const matchesSearch =
      g.capability.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.granted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase());
    const isGrantActive = g.active && (!g.expires_at || new Date(g.expires_at) > new Date());
    if (statusFilter === 'active') return matchesSearch && isGrantActive;
    if (statusFilter === 'expired') return matchesSearch && !isGrantActive;
    return matchesSearch;
  });

  const activeCount = grants.filter(
    (g) => g.active && (!g.expires_at || new Date(g.expires_at) > new Date())
  ).length;
  const expiredCount = grants.length - activeCount;

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden border border-zinc-800 rounded-lg bg-zinc-950">
      {/* HEADER */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <span>GRANULAR CAPABILITY PROFILE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                GET /api/peb/entities/{entityId}/capabilities
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400">
              Active and expired capability grants for <span className="text-emerald-400 font-bold">{entityId}</span>.
            </p>
          </div>
        </div>

        <button
          onClick={fetchGrants}
          className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-cyan-400 transition-colors"
          title="Refresh Grants"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search capability or granter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-zinc-200 placeholder-zinc-600 focus:outline-none w-full text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">FILTER STATUS:</span>
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ALL ({grants.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              ACTIVE ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                statusFilter === 'expired'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              EXPIRED ({expiredCount})
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-semibold">
            <tr>
              <th className={pyClass}>GRANT ID</th>
              <th className={pyClass}>CAPABILITY NAME</th>
              <th className={pyClass}>STATUS</th>
              <th className={pyClass}>GRANTED BY</th>
              <th className={pyClass}>CREATED TIMESTAMP</th>
              <th className={pyClass}>EXPIRATION TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {filteredGrants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500 italic">
                  No matching capability grants found for `{entityId}`.
                </td>
              </tr>
            ) : (
              filteredGrants.map((grant) => {
                const isGrantActive = grant.active && (!grant.expires_at || new Date(grant.expires_at) > new Date());
                return (
                  <tr key={grant.id} className="hover:bg-zinc-900/70 transition-colors">
                    <td className={`${pyClass} font-mono text-zinc-500 text-[10px]`}>{grant.id}</td>
                    <td className={`${pyClass} font-mono font-bold text-cyan-300 flex items-center gap-1.5`}>
                      <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{grant.capability}</span>
                    </td>
                    <td className={pyClass}>
                      {isGrantActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>EXPIRED</span>
                        </span>
                      )}
                    </td>
                    <td className={`${pyClass} text-zinc-300 font-semibold`}>{grant.granted_by}</td>
                    <td className={`${pyClass} text-zinc-500 text-[10px]`}>
                      {new Date(grant.created_at).toLocaleString()}
                    </td>
                    <td className={`${pyClass} text-[10px]`}>
                      {grant.expires_at ? (
                        <span className={isGrantActive ? 'text-zinc-400' : 'text-amber-400 font-bold'}>
                          {new Date(grant.expires_at).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-400/80 italic">Never (Permanent)</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
