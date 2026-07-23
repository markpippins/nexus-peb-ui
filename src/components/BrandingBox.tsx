import React from 'react';
import {
  BrainCircuit,
  Terminal,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  RefreshCw,
  Server,
  Zap,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';
import { ApiMode } from '../api/pebClient';
import { ThemeMode } from '../types/peb';

interface BrandingBoxProps {
  currentRoute: string;
  apiMode: ApiMode;
  baseUrl: string;
  theme: ThemeMode;
  density: 'compact' | 'normal';
  latencyMs: number;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme: () => void;
  onToggleDensity: () => void;
  onOpenMockConfig: () => void;
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BrandingBox: React.FC<BrandingBoxProps> = ({
  currentRoute,
  apiMode,
  baseUrl,
  theme,
  density,
  latencyMs,
  onSelectTheme,
  onToggleTheme,
  onToggleDensity,
  onOpenMockConfig,
  onSearchChange,
  searchTerm = '',
  onRefresh,
  isRefreshing = false
}) => {
  const containerStyle =
    theme === 'dark'
      ? 'bg-zinc-950/90 border-zinc-800/80 text-zinc-100 shadow-lg shadow-black/20'
      : theme === 'steel'
      ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-lg shadow-slate-950/50'
      : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm';

  const brandIconStyle =
    theme === 'steel'
      ? 'from-sky-500/20 to-blue-600/10 border-sky-500/40 text-sky-400'
      : theme === 'light'
      ? 'from-emerald-500/20 to-teal-500/10 border-emerald-600/40 text-emerald-600'
      : 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400';

  const addressBarStyle =
    theme === 'steel'
      ? 'bg-slate-800/90 border-slate-700/90 text-slate-200'
      : theme === 'light'
      ? 'bg-slate-100 border-slate-300 text-slate-800'
      : 'bg-zinc-900/90 border-zinc-800/90 text-zinc-300';

  return (
    <div className={`border-b select-none transition-all duration-200 backdrop-blur-md ${containerStyle}`}>
      {/* Top IDE Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 gap-3 text-xs">
        
        {/* TOP LEFT BRANDING BOX */}
        <div className={`flex items-center gap-2.5 min-w-max pr-3 border-r ${theme === 'light' ? 'border-slate-200' : 'border-zinc-800/80'}`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br border font-mono shadow-sm ${brandIconStyle}`}>
            <BrainCircuit className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono font-bold tracking-wider text-[11px] uppercase">
              <span className={theme === 'steel' ? 'bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent'}>NEXUS</span>
              <span className={theme === 'light' ? 'text-slate-400' : 'text-zinc-600'}>//</span>
              <span className={theme === 'light' ? 'text-slate-800' : 'text-zinc-200'}>PEB-SRV</span>
              <span className={`px-1.5 py-0.5 text-[8px] rounded-md border font-semibold tracking-normal shadow-sm ${
                theme === 'steel'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                  : theme === 'light'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
              }`}>
                GOVERNANCE
              </span>
            </div>
            <div className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
              <ShieldCheck className={`w-3 h-3 ${theme === 'steel' ? 'text-sky-400' : 'text-emerald-400'}`} />
              <span className="tracking-tight">Persistent Engineering Brain</span>
            </div>
          </div>
        </div>

        {/* MIDDLE ADDRESS BAR */}
        <div className={`flex-1 flex items-center gap-2 rounded-lg px-3 py-1 font-mono text-[11px] shadow-inner transition-all ${addressBarStyle}`}>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shadow-sm ${
            theme === 'steel'
              ? 'bg-sky-950 text-sky-300 border-sky-800'
              : theme === 'light'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-emerald-950/90 text-emerald-400 border-emerald-800/80'
          }`}>
            GET
          </span>
          <span className={theme === 'light' ? 'text-slate-400' : 'text-zinc-500'}>http://</span>
          <span className={theme === 'light' ? 'text-slate-600 font-semibold' : 'text-zinc-300 font-semibold truncate'}>
            {apiMode === 'live' ? baseUrl.replace(/^https?:\/\//, '') : 'mock.peb.nexus.local'}
          </span>
          <span className={theme === 'light' ? 'text-slate-400' : 'text-zinc-600'}>/</span>
          <span className={`font-mono font-medium truncate flex-1 ${theme === 'steel' ? 'text-sky-300' : theme === 'light' ? 'text-emerald-700 font-bold' : 'text-emerald-300'}`}>
            {currentRoute}
          </span>

          {/* Quick Search inside Address Bar */}
          {onSearchChange && (
            <div className="relative flex items-center">
              <Search className={`w-3 h-3 absolute left-2.5 pointer-events-none ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'}`} />
              <input
                type="text"
                placeholder="Search receipt / key..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`rounded-md pl-7 pr-2.5 py-1 text-[10px] placeholder-slate-400 focus:outline-none w-40 font-mono transition-all ${
                  theme === 'light'
                    ? 'bg-white border border-slate-300 text-slate-800 focus:border-emerald-500'
                    : theme === 'steel'
                    ? 'bg-slate-900 border border-slate-700 text-slate-100 focus:border-sky-400'
                    : 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-200 focus:border-emerald-500'
                }`}
              />
            </div>
          )}

          {/* Refresh Action */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Re-query Endpoint"
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'light' ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'hover:bg-zinc-800/80 text-zinc-400 hover:text-emerald-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
        </div>

        {/* RIGHT METRICS & CONTROLS */}
        <div className="flex items-center gap-2 min-w-max">
          
          {/* Latency Pill */}
          <div className={`flex items-center gap-1 px-2.5 py-1 border rounded-md text-[10px] font-mono shadow-sm ${
            theme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-700'
              : theme === 'steel'
              ? 'bg-slate-900 border-slate-700 text-sky-300'
              : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-400'
          }`}>
            <Zap className={`w-3 h-3 ${theme === 'steel' ? 'text-sky-400' : 'text-emerald-400'}`} />
            <span className={`font-bold ${theme === 'steel' ? 'text-sky-400' : theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>{latencyMs}ms</span>
          </div>

          {/* API Mode Toggle Button */}
          <button
            onClick={onOpenMockConfig}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-medium border transition-all shadow-sm ${
              apiMode === 'mock'
                ? 'bg-amber-950/50 border-amber-800/80 text-amber-300 hover:bg-amber-900/60 hover:border-amber-600'
                : 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-600'
            }`}
            title="Configure PEB API Connection & Mock Scheme"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-semibold text-[10px]">
              {apiMode === 'mock' ? 'MOCK ENGINE' : 'LIVE API'}
            </span>
            <SlidersHorizontal className="w-3 h-3 ml-0.5 text-zinc-400" />
          </button>

          {/* Density Toggle */}
          <button
            onClick={onToggleDensity}
            title={`Switch to ${density === 'compact' ? 'Normal' : 'Compact'} Density`}
            className={`p-1.5 rounded-md border transition-all ${
              theme === 'light'
                ? 'hover:bg-slate-100 border-slate-300 text-slate-600'
                : 'hover:bg-zinc-800/80 text-zinc-400 border-zinc-800/80'
            }`}
          >
            {density === 'compact' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* 3-WAY THEME SELECTOR PILL GROUP */}
          <div className={`flex items-center gap-0.5 p-0.5 border rounded-lg font-mono text-[10px] ${
            theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-zinc-900/90 border-zinc-800'
          }`}>
            <button
              onClick={() => onSelectTheme('dark')}
              className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-emerald-400 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Dark Obsidian Theme"
            >
              <Moon className="w-3 h-3 text-zinc-300" />
              <span className="text-[9px]">DARK</span>
            </button>
            <button
              onClick={() => onSelectTheme('steel')}
              className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                theme === 'steel'
                  ? 'bg-slate-800 text-sky-300 font-bold shadow-sm border border-sky-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Steel Blue Theme"
            >
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span className="text-[9px]">STEEL</span>
            </button>
            <button
              onClick={() => onSelectTheme('light')}
              className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                theme === 'light'
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Light IDE Theme"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span className="text-[9px]">LIGHT</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
