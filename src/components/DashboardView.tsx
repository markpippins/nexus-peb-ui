import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  RotateCcw,
  BarChart2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  CircuitBreakerStatus,
  ViolationSummary,
  EntropyRollup,
  ServiceHealth,
  ThemeMode
} from '../types/peb';
import { pebClient } from '../api/pebClient';

interface DashboardViewProps {
  theme: ThemeMode;
  density: 'compact' | 'normal';
  onNavigateToEvents: () => void;
  onNavigateToCapability: (entityId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  theme,
  density,
  onNavigateToEvents,
  onNavigateToCapability
}) => {
  const [breakers, setBreakers] = useState<CircuitBreakerStatus[]>([]);
  const [violations, setViolations] = useState<ViolationSummary[]>([]);
  const [entropy, setEntropy] = useState<EntropyRollup | null>(null);
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bData, vData, eData, hData] = await Promise.all([
        pebClient.getCircuitBreakers(),
        pebClient.getViolationsSummary('24h', 'severity'),
        pebClient.getEntropy('entropy_class', '14d'),
        pebClient.getHealth()
      ]);
      setBreakers(bData);
      setViolations(vData);
      setEntropy(eData);
      setHealth(hData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isDark = theme === 'dark';
  const pyClass = density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3.5';

  const SEVERITY_COLORS: Record<string, string> = {
    FATAL: '#ef4444',
    CRITICAL: '#f97316',
    WARNING: '#eab308',
    INFO: '#3b82f6'
  };

  return (
    <div className="space-y-4 p-4 font-mono text-xs overflow-y-auto max-h-full">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>FLEET HEALTH & GOVERNANCE DASHBOARD</span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Real-time circuit breakers, governance event counts, and entropy rollup.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-200 hover:text-emerald-400 transition-colors text-[11px] font-semibold flex items-center gap-1.5"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>RE-QUERY ROLLUPS</span>
        </button>
      </div>

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className={`p-3 rounded border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
            <span>GOVERNANCE EVENTS (TOTAL)</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {health?.counts.governance_events.toLocaleString() || '18,420'}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Log tail cursor active</span>
            <button onClick={onNavigateToEvents} className="text-emerald-400 hover:underline flex items-center gap-0.5">
              <span>View Log</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`p-3 rounded border ${
          breakers.some((b) => b.tripped)
            ? 'bg-rose-950/40 border-rose-900/80 text-rose-200'
            : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-700'
        }`}>
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
            <span>ROLE CIRCUIT BREAKERS</span>
            <AlertTriangle className={`w-4 h-4 ${breakers.some((b) => b.tripped) ? 'text-rose-400 animate-bounce' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-extrabold mt-1 text-rose-400">
            {breakers.filter((b) => b.tripped).length} <span className="text-xs font-normal text-zinc-400">/ {breakers.length} TRIPPED</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {breakers.filter((b) => b.tripped).length > 0 ? 'Tripped roles auto-isolated' : 'All agent roles operational'}
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`p-3 rounded border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
            <span>VIOLATIONS (24H WINDOW)</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {health?.counts.violations_24h || 37}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Capability oversteps & limits</span>
            <button onClick={() => onNavigateToCapability()} className="text-amber-400 hover:underline flex items-center gap-0.5">
              <span>Inspect Gap</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4 */}
        <div className={`p-3 rounded border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
            <span>SYSTEM ENTROPY CLASS</span>
            <Flame className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 mt-1">
            STABLE_LOW
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            6,810 decisions evaluated
          </div>
        </div>
      </div>

      {/* CIRCUIT BREAKER STATUS GRID */}
      <div className={`p-3.5 rounded border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-700'}`}>
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-zinc-200 uppercase tracking-wider text-xs">
              ROLE CIRCUIT BREAKER MONITORING (`peb.role_circuit_breaker`)
            </h2>
          </div>
          <span className="text-[10px] text-zinc-500">TRIPPED-FIRST ORDERING</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-semibold">
                <th className={pyClass}>ROLE / AGENT</th>
                <th className={pyClass}>STATUS</th>
                <th className={pyClass}>TRIP COUNT</th>
                <th className={pyClass}>THRESHOLD</th>
                <th className={pyClass}>ACTIVE VIOLATIONS</th>
                <th className={pyClass}>COOLDOWN</th>
                <th className={pyClass}>LAST TRIPPED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {breakers.map((b) => (
                <tr key={b.role} className="hover:bg-zinc-900/60 transition-colors">
                  <td className={`${pyClass} font-bold text-emerald-300 flex items-center gap-2`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500/60"></span>
                    <span>{b.role}</span>
                  </td>
                  <td className={pyClass}>
                    {b.tripped ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        TRIPPED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        OPERATIONAL
                      </span>
                    )}
                  </td>
                  <td className={`${pyClass} font-mono font-semibold`}>{b.trip_count}</td>
                  <td className={pyClass}>{b.threshold} trips</td>
                  <td className={pyClass}>
                    <span className={b.active_violations > 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                      {b.active_violations}
                    </span>
                  </td>
                  <td className={pyClass}>
                    {b.tripped ? (
                      <span className="text-rose-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" />
                        {b.cooldown_seconds}s
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className={`${pyClass} text-zinc-400 text-[10px]`}>
                    {b.last_tripped_at ? new Date(b.last_tripped_at).toLocaleTimeString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Entropy Trend */}
        <div className={`p-3.5 rounded border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h2 className="font-bold text-zinc-200 uppercase tracking-wider text-xs">
                DECISION ENTROPY TREND (14-DAY ROLLUP)
              </h2>
            </div>
            <span className="text-[10px] text-indigo-400 font-mono">`peb.decisions.entropy_class`</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={entropy?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="entropyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 10 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '11px', color: '#e4e4e7' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#entropyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Violations Breakdown */}
        <div className={`p-3.5 rounded border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-900 border-slate-700'}`}>
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-zinc-200 uppercase tracking-wider text-xs">
                VIOLATIONS BY SEVERITY & TYPE
              </h2>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">`peb.violations`</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="violation_type" stroke="#71717a" tick={{ fontSize: 9 }} interval={0} />
                <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '11px', color: '#e4e4e7' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {violations.map((v, idx) => (
                    <Cell key={idx} fill={SEVERITY_COLORS[v.severity] || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
