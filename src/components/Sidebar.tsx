import React from 'react';
import {
  Activity,
  ScrollText,
  GitCommit,
  ShieldAlert,
  GitCompare,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { ThemeMode } from '../types/peb';

export type ViewType = 'dashboard' | 'events' | 'causal' | 'capability' | 'state' | 'mock';

interface SidebarProps {
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeBreakerCount: number;
  sseStreaming: boolean;
  theme: ThemeMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  activeBreakerCount,
  sseStreaming,
  theme
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: React.ReactNode; shortcut: string }[] = [
    {
      id: 'dashboard',
      label: 'Fleet & Circuit Breakers',
      icon: <Activity className="w-4 h-4" />,
      shortcut: '⌘1',
      badge: activeBreakerCount > 0 ? (
        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 animate-pulse">
          {activeBreakerCount} TRIP
        </span>
      ) : null
    },
    {
      id: 'events',
      label: 'Event Stream & Log Tail',
      icon: <ScrollText className="w-4 h-4" />,
      shortcut: '⌘2',
      badge: sseStreaming ? (
        <span className={`flex items-center gap-1 text-[10px] font-mono ${theme === 'steel' ? 'text-sky-400' : 'text-emerald-400'}`}>
          <Radio className={`w-3 h-3 animate-pulse ${theme === 'steel' ? 'text-sky-400' : 'text-emerald-400'}`} />
          <span>LIVE</span>
        </span>
      ) : null
    },
    {
      id: 'causal',
      label: 'Causal Graph & Traces',
      icon: <GitCommit className="w-4 h-4" />,
      shortcut: '⌘3'
    },
    {
      id: 'capability',
      label: 'Capability Gap Overlay',
      icon: <ShieldAlert className="w-4 h-4" />,
      shortcut: '⌘4'
    },
    {
      id: 'state',
      label: 'State History & Diffing',
      icon: <GitCompare className="w-4 h-4" />,
      shortcut: '⌘5'
    },
    {
      id: 'mock',
      label: 'Mock Scheme & REST Specs',
      icon: <Sliders className="w-4 h-4" />,
      shortcut: '⌘6'
    }
  ];

  const sidebarBgStyle =
    theme === 'dark'
      ? 'bg-zinc-950/90 border-zinc-800/80 text-zinc-300'
      : theme === 'steel'
      ? 'bg-slate-900/95 border-slate-700/80 text-slate-200'
      : 'bg-white border-slate-200 text-slate-800 shadow-sm';

  return (
    <aside
      className={`border-r select-none transition-all duration-200 flex flex-col justify-between backdrop-blur-md ${
        collapsed ? 'w-14' : 'w-64'
      } ${sidebarBgStyle}`}
    >
      <div>
        {/* Navigation Section Title */}
        {!collapsed && (
          <div className={`px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-between border-b ${
            theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-zinc-500 border-zinc-800/80'
          }`}>
            <span className={`tracking-widest ${theme === 'steel' ? 'text-sky-400' : theme === 'light' ? 'text-emerald-700 font-extrabold' : 'text-emerald-400/80'}`}>OBSERVABILITY SUITE</span>
            <span className={`px-1.5 py-0.5 text-[9px] rounded-md border font-bold ${
              theme === 'steel'
                ? 'bg-slate-800 text-sky-300 border-slate-700'
                : theme === 'light'
                ? 'bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-zinc-900 text-emerald-400 border-zinc-800'
            }`}>v1.4</span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;

            let activeItemStyle = '';
            if (isActive) {
              if (theme === 'steel') {
                activeItemStyle = 'bg-gradient-to-r from-sky-950/90 via-sky-900/50 to-transparent border border-sky-500/50 text-sky-200 font-semibold shadow-[0_0_12px_rgba(56,189,248,0.15)]';
              } else if (theme === 'light') {
                activeItemStyle = 'bg-slate-100 border border-slate-300 text-slate-900 font-bold shadow-sm';
              } else {
                activeItemStyle = 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/40 to-transparent border border-emerald-500/50 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.12)]';
              }
            } else {
              activeItemStyle = theme === 'light'
                ? 'hover:bg-slate-100/80 hover:text-slate-900 text-slate-600 border border-transparent'
                : 'hover:bg-zinc-900/80 hover:text-zinc-100 text-zinc-400 border border-transparent';
            }

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-150 ${activeItemStyle}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? (theme === 'steel' ? 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]' : 'text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]') : 'text-zinc-400'}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && (
                  <div className="flex items-center gap-2">
                    {item.badge}
                    <span className="text-[10px] text-zinc-500 font-mono hidden group-hover:inline">
                      {item.shortcut}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer & Collapse Toggle */}
      <div className={`p-2 border-t space-y-2 ${theme === 'light' ? 'border-slate-200' : 'border-zinc-800/80'}`}>
        {!collapsed && activeBreakerCount > 0 && (
          <div className="p-2 rounded bg-rose-950/40 border border-rose-900/80 text-rose-300 text-[11px] font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-200">{activeBreakerCount} Role Breakers Tripped</div>
              <div className="text-[10px] text-rose-400/90 leading-tight mt-0.5">
                Check Fleet Health panel for automatic rollback & cooldown timers.
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`w-full flex items-center justify-center py-1 rounded text-xs font-mono border transition-colors ${
            theme === 'light'
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-300'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-zinc-800/80'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-1"><ChevronLeft className="w-4 h-4" /><span className="text-[10px]">COLLAPSE PANEL</span></div>}
        </button>
      </div>
    </aside>
  );
};
