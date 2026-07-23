import React from 'react';
import {
  Radio,
  Database,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';
import { ApiMode } from '../api/pebClient';
import { ThemeMode } from '../types/peb';

interface StatusBarProps {
  apiMode: ApiMode;
  theme: ThemeMode;
  density: 'compact' | 'normal';
  totalEvents: number;
  activeBreakerCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  apiMode,
  theme,
  density,
  totalEvents,
  activeBreakerCount
}) => {
  const footerBg =
    theme === 'steel'
      ? 'bg-slate-900 border-slate-700/80 text-slate-300'
      : theme === 'light'
      ? 'bg-slate-100 border-slate-300 text-slate-700'
      : 'bg-zinc-950 border-zinc-800 text-zinc-400';

  const sseColor = theme === 'steel' ? 'text-sky-400' : theme === 'light' ? 'text-emerald-700 font-extrabold' : 'text-emerald-400';

  return (
    <footer className={`border-t px-3 py-1 text-[10px] font-mono flex items-center justify-between select-none shrink-0 transition-colors ${footerBg}`}>
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 font-bold ${sseColor}`}>
          <Radio className={`w-3 h-3 animate-pulse ${sseColor}`} />
          <span>SSE: ACTIVE</span>
        </div>

        <span className={theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}>|</span>

        <div className={`flex items-center gap-1 ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
          <Database className="w-3 h-3 text-indigo-400" />
          <span>DSN: postgresql://pguser:***@localhost:5432/nexus</span>
        </div>

        <span className={theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}>|</span>

        <div className={`flex items-center gap-1 ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
          <Layers className="w-3 h-3 text-amber-500" />
          <span>8 PEB SCHEMAS (NO FK)</span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <ShieldCheck className={`w-3 h-3 ${sseColor}`} />
          <span className={`font-bold ${sseColor}`}>{totalEvents} Events Recorded</span>
        </div>

        <span className={theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}>|</span>

        {activeBreakerCount > 0 ? (
          <span className="text-rose-400 font-bold bg-rose-950 px-1 rounded border border-rose-900 animate-pulse">
            {activeBreakerCount} Breakers Tripped
          </span>
        ) : (
          <span className={`font-bold ${sseColor}`}>All Breakers OK</span>
        )}

        <span className={theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}>|</span>

        <span className={`uppercase font-bold ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
          {apiMode === 'mock' ? 'MOCK ENGINE' : 'LIVE API'}
        </span>
      </div>
    </footer>
  );
};
