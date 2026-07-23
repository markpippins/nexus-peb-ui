import React, { useState, useEffect } from 'react';
import { BrandingBox } from './components/BrandingBox';
import { Sidebar, ViewType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EventsView } from './components/EventsView';
import { CausalGraphView } from './components/CausalGraphView';
import { CapabilityGapView } from './components/CapabilityGapView';
import { StateDiffView } from './components/StateDiffView';
import { ApiSpecsView } from './components/ApiSpecsView';
import { StatusBar } from './components/StatusBar';
import { MockConfigModal } from './components/MockConfigModal';
import { TransactionDetailPanel } from './components/TransactionDetailPanel';
import { pebClient, ApiMode } from './api/pebClient';
import { ThemeMode } from './types/peb';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('steel');
  const [density, setDensity] = useState<'compact' | 'normal'>('compact');
  const [apiMode, setApiMode] = useState<ApiMode>('mock');
  const [baseUrl, setBaseUrl] = useState<string>(
    (import.meta as any).env?.VITE_PEB_API_BASE_URL || 'http://localhost:4206'
  );
  const [showMockConfig, setShowMockConfig] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetEntityForCapability, setTargetEntityForCapability] = useState<string>('agent:runner-pod-99');
  const [inspectTxId, setInspectTxId] = useState<string | null>(null);

  // Stats for Header / Status Bar
  const [activeBreakers, setActiveBreakers] = useState(2);
  const [totalEvents, setTotalEvents] = useState(18420);
  const [latencyMs, setLatencyMs] = useState(14);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const start = performance.now();
        const [breakersData, healthData] = await Promise.all([
          pebClient.getCircuitBreakers(),
          pebClient.getHealth()
        ]);
        const end = performance.now();
        setLatencyMs(Math.round(end - start));
        setActiveBreakers(breakersData.filter((b) => b.tripped).length);
        if (healthData?.counts?.governance_events) {
          setTotalEvents(healthData.counts.governance_events);
        }
      } catch (err) {
        console.error('Failed to sync app stats:', err);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 8000);
    return () => clearInterval(interval);
  }, [apiMode, baseUrl, refreshKey]);

  // Route label mapping for address bar
  const ROUTE_MAP: Record<ViewType, string> = {
    dashboard: 'api/peb/health/circuit-breakers',
    events: 'api/peb/events?limit=50',
    causal: 'api/peb/transactions/tx_994a_102/lineage',
    capability: `api/peb/entities/${targetEntityForCapability}/capability-gap`,
    state: 'api/peb/state/governance.policy.v2/diff?from=tx_994a_080&to=current',
    mock: 'api/peb/specs'
  };

  const handleNavigateToCapability = (entityId?: string) => {
    if (entityId) setTargetEntityForCapability(entityId);
    setActiveView('capability');
  };

  const handleCycleTheme = () => {
    if (theme === 'dark') setTheme('steel');
    else if (theme === 'steel') setTheme('light');
    else setTheme('dark');
  };

  const rootBgClass =
    theme === 'dark'
      ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100'
      : theme === 'steel'
      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-slate-100'
      : 'bg-slate-100 text-slate-900';

  const mainBgClass =
    theme === 'dark'
      ? 'bg-zinc-900/40'
      : theme === 'steel'
      ? 'bg-slate-900/60'
      : 'bg-slate-50';

  return (
    <div className={`h-screen w-screen flex flex-col font-sans select-none overflow-hidden ${rootBgClass}`}>
      {/* TOP BRANDING BOX & ADDRESS BAR */}
      <BrandingBox
        currentRoute={ROUTE_MAP[activeView]}
        apiMode={apiMode}
        baseUrl={baseUrl}
        theme={theme}
        density={density}
        latencyMs={latencyMs}
        onSelectTheme={(newTheme) => setTheme(newTheme)}
        onToggleTheme={handleCycleTheme}
        onToggleDensity={() => setDensity(density === 'compact' ? 'normal' : 'compact')}
        onOpenMockConfig={() => setShowMockConfig(true)}
        searchTerm={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />

      {/* MIDDLE BODY AREA: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeBreakerCount={activeBreakers}
          sseStreaming={true}
          theme={theme}
        />

        {/* MAIN DISPLAY STAGE */}
        <main className={`flex-1 overflow-hidden relative ${mainBgClass}`}>
          {activeView === 'dashboard' && (
            <DashboardView
              theme={theme}
              density={density}
              onNavigateToEvents={() => setActiveView('events')}
              onNavigateToCapability={handleNavigateToCapability}
            />
          )}

          {activeView === 'events' && (
            <EventsView
              theme={theme}
              density={density}
              searchTerm={searchTerm}
            />
          )}

          {activeView === 'causal' && (
            <CausalGraphView
              theme={theme}
              density={density}
            />
          )}

          {activeView === 'capability' && (
            <CapabilityGapView
              theme={theme}
              density={density}
              initialEntityId={targetEntityForCapability}
            />
          )}

          {activeView === 'state' && (
            <StateDiffView
              theme={theme}
              density={density}
            />
          )}

          {activeView === 'mock' && (
            <ApiSpecsView
              theme={theme}
              density={density}
              apiMode={apiMode}
              onOpenMockConfig={() => setShowMockConfig(true)}
            />
          )}
        </main>
      </div>

      {/* BOTTOM STATUS BAR */}
      <StatusBar
        apiMode={apiMode}
        theme={theme}
        density={density}
        totalEvents={totalEvents}
        activeBreakerCount={activeBreakers}
      />

      {/* MOCK CONFIG MODAL */}
      <MockConfigModal
        isOpen={showMockConfig}
        onClose={() => setShowMockConfig(false)}
        apiMode={apiMode}
        onModeChange={setApiMode}
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseUrl}
        onTriggerRefresh={() => setRefreshKey((k) => k + 1)}
      />

      {/* TRANSACTION DETAIL PANEL SLIDE-OVER */}
      {inspectTxId && (
        <TransactionDetailPanel
          transactionId={inspectTxId}
          onClose={() => setInspectTxId(null)}
          onNavigateToLineage={(txId) => {
            setActiveView('causal');
            setInspectTxId(null);
          }}
          theme={theme}
        />
      )}
    </div>
  );
}
