import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  RotateCcw,
  Play,
  Pause,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Radio,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Repeat
} from 'lucide-react';
import { GovernanceEvent, ThemeMode } from '../types/peb';
import { pebClient } from '../api/pebClient';

interface EventsViewProps {
  theme: ThemeMode;
  density: 'compact' | 'normal';
  searchTerm?: string;
}

export const EventsView: React.FC<EventsViewProps> = ({
  theme,
  density,
  searchTerm = ''
}) => {
  const [events, setEvents] = useState<GovernanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sseActive, setSseActive] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<GovernanceEvent | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<string | null>(null);
  const [replayingReceipt, setReplayingReceipt] = useState<string | null>(null);

  // Filters
  const [eventType, setEventType] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [agentRole, setAgentRole] = useState<string>('');
  const [workRequestId, setWorkRequestId] = useState<string>('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await pebClient.getEvents({
        event_type: eventType || undefined,
        plan_id: planId || undefined,
        agent_role: agentRole || undefined,
        work_request_id: workRequestId || undefined,
        limit: 50
      });
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eventType, planId, agentRole, workRequestId]);

  // Subscribe to SSE
  useEffect(() => {
    if (!sseActive) return;

    const unsubscribe = pebClient.subscribeEventStream(
      (newEvent) => {
        setEvents((prev) => {
          // Prevent duplicates
          if (prev.some((e) => e.id === newEvent.id)) return prev;
          return [newEvent, ...prev];
        });
      },
      (err) => console.error('SSE Error:', err),
      { plan_id: planId || undefined, agent_role: agentRole || undefined }
    );

    return () => {
      unsubscribe();
    };
  }, [sseActive, planId, agentRole]);

  const handleCopyReceipt = (receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(receiptId);
    setCopiedReceipt(receiptId);
    setTimeout(() => setCopiedReceipt(null), 1500);
  };

  const handleReplay = async (receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReplayingReceipt(receiptId);
    try {
      await pebClient.replayEvent(receiptId);
      await fetchEvents();
    } catch (err) {
      alert(`Replay error: ${(err as Error).message}`);
    } finally {
      setReplayingReceipt(null);
    }
  };

  const isDark = theme === 'dark';
  const pyClass = density === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3.5';

  const filteredEvents = events.filter((ev) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ev.receipt_id.toLowerCase().includes(term) ||
      ev.agent_role.toLowerCase().includes(term) ||
      ev.plan_id.toLowerCase().includes(term) ||
      ev.work_request_id.toLowerCase().includes(term) ||
      ev.event_type.toLowerCase().includes(term)
    );
  });

  const EVENT_TYPE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
    admission: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-800' },
    decision: { bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-800' },
    capability_grant: { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-800' },
    capability_revoke: { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-800' },
    violation: { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-800' },
    circuit_breaker_trip: { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-800' },
    replay: { bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-800' }
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden">
      {/* TOP HEADER BAR */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
        <div>
          <h1 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-emerald-400" />
            <span>GOVERNANCE EVENT LOG TAIL & SSE STREAM</span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Cursor-paginated stream over `peb.governance_events`. Click row to view receipt details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* SSE Toggle */}
          <button
            onClick={() => setSseActive(!sseActive)}
            className={`px-3 py-1.5 rounded font-bold text-[11px] border transition-colors flex items-center gap-1.5 ${
              sseActive
                ? 'bg-emerald-950 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {sseActive ? <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{sseActive ? 'SSE STREAM ACTIVE' : 'STREAM PAUSED'}</span>
          </button>

          <button
            onClick={fetchEvents}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors"
            title="Refresh events list"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="p-2.5 border-b border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center gap-2 text-[11px] shrink-0">
        <div className="flex items-center gap-1 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>FILTERS:</span>
        </div>

        {/* Event Type Filter */}
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
        >
          <option value="">All Event Types</option>
          <option value="admission">admission</option>
          <option value="decision">decision</option>
          <option value="capability_grant">capability_grant</option>
          <option value="capability_revoke">capability_revoke</option>
          <option value="violation">violation</option>
          <option value="circuit_breaker_trip">circuit_breaker_trip</option>
          <option value="replay">replay</option>
        </select>

        {/* Agent Role Filter */}
        <select
          value={agentRole}
          onChange={(e) => setAgentRole(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
        >
          <option value="">All Agent Roles</option>
          <option value="code_executor_role">code_executor_role</option>
          <option value="db_migration_agent">db_migration_agent</option>
          <option value="security_policy_enforcer">security_policy_enforcer</option>
          <option value="release_pipeline_agent">release_pipeline_agent</option>
        </select>

        {/* Work Request Input */}
        <input
          type="text"
          placeholder="Work Req ID..."
          value={workRequestId}
          onChange={(e) => setWorkRequestId(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono w-28"
        />

        {/* Plan ID Input */}
        <input
          type="text"
          placeholder="Plan ID..."
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono w-28"
        />

        {(eventType || agentRole || workRequestId || planId) && (
          <button
            onClick={() => {
              setEventType('');
              setAgentRole('');
              setWorkRequestId('');
              setPlanId('');
            }}
            className="text-[10px] text-rose-400 hover:underline font-mono ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* MAIN CONTENT SPLIT LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LOG TABLE */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-semibold z-10">
              <tr>
                <th className={pyClass}>ID</th>
                <th className={pyClass}>RECEIPT ID</th>
                <th className={pyClass}>TYPE</th>
                <th className={pyClass}>AGENT ROLE</th>
                <th className={pyClass}>WORK REQ</th>
                <th className={pyClass}>PLAN ID</th>
                <th className={pyClass}>TIMESTAMP</th>
                <th className={pyClass}>REPLAY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredEvents.map((ev) => {
                const style = EVENT_TYPE_BADGES[ev.event_type] || EVENT_TYPE_BADGES.admission;
                const isSelected = selectedEvent?.id === ev.id;

                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/60 border-l-2 border-l-emerald-400'
                        : 'hover:bg-zinc-900/80'
                    }`}
                  >
                    <td className={`${pyClass} font-mono text-zinc-500 text-[11px]`}>#{ev.id}</td>
                    
                    {/* RECEIPT ID WITH COPY */}
                    <td className={`${pyClass} font-mono text-emerald-400 font-bold`}>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[120px]">{ev.receipt_id}</span>
                        <button
                          onClick={(e) => handleCopyReceipt(ev.receipt_id, e)}
                          className="text-zinc-500 hover:text-zinc-200 transition-colors"
                          title="Copy receipt ID"
                        >
                          {copiedReceipt === ev.receipt_id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* TYPE */}
                    <td className={pyClass}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                        {ev.event_type}
                      </span>
                    </td>

                    {/* ROLE */}
                    <td className={`${pyClass} font-mono text-zinc-300 truncate max-w-[130px]`}>
                      {ev.agent_role}
                    </td>

                    {/* WORK REQ */}
                    <td className={`${pyClass} font-mono text-amber-300/90`}>{ev.work_request_id}</td>

                    {/* PLAN */}
                    <td className={`${pyClass} font-mono text-indigo-300/90`}>{ev.plan_id}</td>

                    {/* TIMESTAMP */}
                    <td className={`${pyClass} text-zinc-500 text-[10px]`}>
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </td>

                    {/* REPLAY ACTION */}
                    <td className={pyClass}>
                      <div className="flex items-center gap-1.5">
                        {ev.replayed_at ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                            REPLAYED
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleReplay(ev.receipt_id, e)}
                            disabled={replayingReceipt === ev.receipt_id}
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-300 text-zinc-400 text-[10px] font-bold flex items-center gap-1 transition-colors"
                            title="POST /api/peb/events/{receipt_id}/replay"
                          >
                            <Repeat className={`w-3 h-3 ${replayingReceipt === ev.receipt_id ? 'animate-spin text-emerald-400' : ''}`} />
                            <span>REPLAY</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* DETAIL INSPECTION DRAWER */}
        {selectedEvent && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-emerald-400 text-xs">EVENT RECEIPT DETAILED PAYLOAD</span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-zinc-500 hover:text-zinc-200 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-zinc-900 py-1">
                  <span className="text-zinc-500">Receipt ID:</span>
                  <span className="text-emerald-300 font-bold">{selectedEvent.receipt_id}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 py-1">
                  <span className="text-zinc-500">Event Type:</span>
                  <span className="text-zinc-200 font-bold">{selectedEvent.event_type}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 py-1">
                  <span className="text-zinc-500">Agent Role:</span>
                  <span className="text-zinc-200">{selectedEvent.agent_role}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 py-1">
                  <span className="text-zinc-500">Work Request:</span>
                  <span className="text-amber-300">{selectedEvent.work_request_id}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 py-1">
                  <span className="text-zinc-500">Plan ID:</span>
                  <span className="text-indigo-300">{selectedEvent.plan_id}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 py-1">
                  <span className="text-zinc-500">Created At:</span>
                  <span className="text-zinc-400">{new Date(selectedEvent.created_at).toLocaleString()}</span>
                </div>
                {selectedEvent.replayed_at && (
                  <div className="flex justify-between border-b border-zinc-900 py-1 text-blue-400">
                    <span>Replayed At:</span>
                    <span>{new Date(selectedEvent.replayed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* RAW PAYLOAD JSON */}
              <div className="space-y-1 mt-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Payload Object:</span>
                <pre className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 text-[10px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <button
                onClick={(e) => handleReplay(selectedEvent.receipt_id, e)}
                disabled={replayingReceipt === selectedEvent.receipt_id}
                className="w-full py-1.5 rounded bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Repeat className={`w-3.5 h-3.5 ${replayingReceipt === selectedEvent.receipt_id ? 'animate-spin' : ''}`} />
                <span>POST /api/peb/events/{selectedEvent.receipt_id}/replay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
