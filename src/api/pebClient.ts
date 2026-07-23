import {
  GovernanceEvent,
  CircuitBreakerStatus,
  ViolationSummary,
  EntropyRollup,
  Transaction,
  DecisionChainNode,
  TraceTreeNode,
  CapabilityGrant,
  CapabilityGapItem,
  LineagePayload,
  StateVersion,
  StateDiff,
  ServiceHealth
} from '../types/peb';

import {
  INITIAL_HEALTH,
  MOCK_CIRCUIT_BREAKERS,
  MOCK_VIOLATIONS_SUMMARY,
  MOCK_ENTROPY,
  generateInitialEvents,
  MOCK_TRANSACTIONS,
  MOCK_DECISIONS_CHAIN,
  MOCK_TRACE_TREE,
  MOCK_CAPABILITY_GAP,
  MOCK_STATE_VERSIONS,
  MOCK_STATE_VALUES
} from './mockData';

export type ApiMode = 'mock' | 'live';

class PebApiClient {
  private mode: ApiMode = 'mock';
  private baseUrl: string = 'http://localhost:3111';
  private eventsStore: GovernanceEvent[] = generateInitialEvents();
  private mockSseSubscribers: Set<(event: GovernanceEvent) => void> = new Set();
  private sseTimer: any = null;

  constructor() {
    this.startMockSseStream();
  }

  public getMode(): ApiMode {
    return this.mode;
  }

  public setMode(mode: ApiMode) {
    this.mode = mode;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  // Simulates or connects live SSE stream
  private startMockSseStream() {
    if (this.sseTimer) clearInterval(this.sseTimer);
    this.sseTimer = setInterval(() => {
      if (this.mode !== 'mock' || this.mockSseSubscribers.size === 0) return;

      const newId = (this.eventsStore[0]?.id || 1000) + 1;
      const roles = ['code_executor_role', 'db_migration_agent', 'security_policy_enforcer', 'release_pipeline_agent'];
      const types: GovernanceEvent['event_type'][] = ['admission', 'decision', 'violation', 'circuit_breaker_trip'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const chosenRole = roles[Math.floor(Math.random() * roles.length)];

      const newEvent: GovernanceEvent = {
        id: newId,
        receipt_id: `rcpt_${Math.floor(100000 + Math.random() * 900000)}_${chosenType.slice(0, 4)}`,
        event_type: chosenType,
        plan_id: `plan_nexus_00${Math.floor(Math.random() * 5) + 1}`,
        agent_role: chosenRole,
        work_request_id: `wrk_${Math.floor(800 + Math.random() * 200)}`,
        payload: {
          streamed: true,
          status: chosenType === 'violation' ? 'DENIED' : 'ADMITTED',
          latency_ms: Math.floor(20 + Math.random() * 100)
        },
        replayed_at: null,
        created_at: new Date().toISOString()
      };

      this.eventsStore.unshift(newEvent);
      this.mockSseSubscribers.forEach((cb) => cb(newEvent));
    }, 4000);
  }

  private async delay(ms = 150) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // --- Endpoints ---

  public async getHealth(): Promise<ServiceHealth> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
      return res.json();
    }
    await this.delay();
    return {
      ...INITIAL_HEALTH,
      counts: {
        ...INITIAL_HEALTH.counts,
        governance_events: this.eventsStore.length
      }
    };
  }

  public async getEvents(params?: {
    since?: number;
    event_type?: string;
    plan_id?: string;
    agent_role?: string;
    work_request_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: GovernanceEvent[]; has_more: boolean; next_cursor: number | null }> {
    if (this.mode === 'live') {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '') query.append(k, String(v));
        });
      }
      const res = await fetch(`${this.baseUrl}/api/peb/events?${query.toString()}`);
      if (!res.ok) throw new Error(`Fetch events failed: ${res.statusText}`);
      const data = await res.json();
      return Array.isArray(data) ? { events: data, has_more: false, next_cursor: null } : data;
    }

    await this.delay();
    let filtered = [...this.eventsStore];

    if (params?.since !== undefined) {
      filtered = filtered.filter((e) => e.id > params.since!);
    }
    if (params?.event_type) {
      filtered = filtered.filter((e) => e.event_type === params.event_type);
    }
    if (params?.plan_id) {
      filtered = filtered.filter((e) => e.plan_id.includes(params.plan_id!));
    }
    if (params?.agent_role) {
      filtered = filtered.filter((e) => e.agent_role === params.agent_role);
    }
    if (params?.work_request_id) {
      filtered = filtered.filter((e) => e.work_request_id.includes(params.work_request_id!));
    }

    const limit = params?.limit || 20;
    const offset = params?.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      events: paginated,
      has_more: offset + limit < filtered.length,
      next_cursor: paginated.length > 0 ? paginated[paginated.length - 1].id : null
    };
  }

  public async getEventByReceipt(receiptId: string): Promise<GovernanceEvent> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/events/${encodeURIComponent(receiptId)}`);
      if (!res.ok) throw new Error(`Event not found: ${receiptId}`);
      return res.json();
    }
    await this.delay();
    const event = this.eventsStore.find((e) => e.receipt_id === receiptId);
    if (!event) throw new Error(`Event receipt '${receiptId}' not found in PEB ledger.`);
    return event;
  }

  public async replayEvent(receiptId: string): Promise<{ success: boolean; replayed_at: string; event: GovernanceEvent }> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/events/${encodeURIComponent(receiptId)}/replay`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`Replay failed: ${res.statusText}`);
      return res.json();
    }

    await this.delay(250);
    const event = this.eventsStore.find((e) => e.receipt_id === receiptId);
    if (!event) throw new Error(`Event receipt '${receiptId}' not found.`);

    const now = new Date().toISOString();
    event.replayed_at = now;

    // Create a replay event push
    const replayPush: GovernanceEvent = {
      id: (this.eventsStore[0]?.id || 1000) + 1,
      receipt_id: `rcpt_replay_${Math.floor(100000 + Math.random() * 900000)}`,
      event_type: 'replay',
      plan_id: event.plan_id,
      agent_role: event.agent_role,
      work_request_id: event.work_request_id,
      payload: {
        replayed_receipt_id: receiptId,
        original_event_type: event.event_type,
        triggered_by: 'peb-srv-ide-ui'
      },
      replayed_at: null,
      created_at: now
    };

    this.eventsStore.unshift(replayPush);
    this.mockSseSubscribers.forEach((cb) => cb(replayPush));

    return {
      success: true,
      replayed_at: now,
      event
    };
  }

  public async getCircuitBreakers(): Promise<CircuitBreakerStatus[]> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/health/circuit-breakers`);
      if (!res.ok) throw new Error(`Fetch circuit breakers failed: ${res.statusText}`);
      return res.json();
    }
    await this.delay();
    return MOCK_CIRCUIT_BREAKERS;
  }

  public async getViolationsSummary(window = '24h', groupBy = 'severity'): Promise<ViolationSummary[]> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/health/violations/summary?window=${window}&group_by=${groupBy}`);
      if (!res.ok) throw new Error(`Fetch violations summary failed: ${res.statusText}`);
      return res.json();
    }
    await this.delay();
    return MOCK_VIOLATIONS_SUMMARY;
  }

  public async getEntropy(groupBy = 'entropy_class', window = '14d'): Promise<EntropyRollup> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/health/entropy?group_by=${groupBy}&window=${window}`);
      if (!res.ok) throw new Error(`Fetch entropy failed: ${res.statusText}`);
      return res.json();
    }
    await this.delay();
    return MOCK_ENTROPY;
  }

  public async getTransactions(params?: {
    entity_id?: string;
    tool_name?: string;
    admission_result?: string;
  }): Promise<Transaction[]> {
    if (this.mode === 'live') {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) query.append(k, v);
        });
      }
      const res = await fetch(`${this.baseUrl}/api/peb/transactions?${query.toString()}`);
      if (!res.ok) throw new Error(`Fetch transactions failed: ${res.statusText}`);
      return res.json();
    }

    await this.delay();
    let res = [...MOCK_TRANSACTIONS];
    if (params?.entity_id) res = res.filter((t) => t.entity_id === params.entity_id);
    if (params?.tool_name) res = res.filter((t) => t.tool_name === params.tool_name);
    if (params?.admission_result) res = res.filter((t) => t.admission_result === params.admission_result);
    return res;
  }

  public async getLineage(transactionId: string): Promise<LineagePayload> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/transactions/${encodeURIComponent(transactionId)}/lineage`);
      if (!res.ok) throw new Error(`Fetch lineage failed: ${res.statusText}`);
      return res.json();
    }

    await this.delay();
    const tx = MOCK_TRANSACTIONS.find((t) => t.id === transactionId) || MOCK_TRANSACTIONS[0];
    return {
      transaction: tx,
      parent_transactions: MOCK_TRANSACTIONS.filter((t) => t.id !== tx.id),
      decisions: MOCK_DECISIONS_CHAIN,
      capabilities_checked: [
        {
          id: 'grant_101',
          entity_id: tx.entity_id,
          capability: 'exec_container_script',
          granted_by: 'security_policy_enforcer',
          active: true,
          created_at: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
          expires_at: null
        }
      ],
      violations_raised: [
        {
          id: 'viol_8801',
          violation_type: 'UNAUTHORIZED_CAPABILITY_ACCESS',
          severity: 'CRITICAL',
          capability_attempted: 'exec:raw_sql',
          created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
        }
      ]
    };
  }

  public async getDecisionChain(id: string, direction: 'ancestry' | 'rollback' = 'ancestry'): Promise<DecisionChainNode[]> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/decisions/${encodeURIComponent(id)}/chain?direction=${direction}`);
      if (!res.ok) throw new Error(`Fetch decision chain failed: ${res.statusText}`);
      return res.json();
    }
    await this.delay();
    return MOCK_DECISIONS_CHAIN;
  }

  public async getTraceTree(id: string): Promise<TraceTreeNode> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/traces/${encodeURIComponent(id)}/tree`);
      if (!res.ok) throw new Error(`Fetch trace tree failed: ${res.statusText}`);
      return res.json();
    }
    await this.delay();
    return MOCK_TRACE_TREE;
  }

  public async getCapabilityGap(entityId: string): Promise<CapabilityGapItem[]> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/entities/${encodeURIComponent(entityId)}/capability-gap`);
      if (!res.ok) throw new Error(`Fetch capability gap failed: ${res.statusText}`);
      return res.json();
    }
    await this.delay();
    return MOCK_CAPABILITY_GAP;
  }

  public async getStateVersions(key: string): Promise<{ key: string; versions: StateVersion[]; current: any }> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/state/${encodeURIComponent(key)}/versions`);
      if (!res.ok) throw new Error(`Fetch state versions failed: ${res.statusText}`);
      return res.json();
    }

    await this.delay();
    const versions = MOCK_STATE_VERSIONS[key] || MOCK_STATE_VERSIONS['governance.policy.v2'];
    const current = MOCK_STATE_VALUES[key] || MOCK_STATE_VALUES['governance.policy.v2'];

    return {
      key,
      versions,
      current
    };
  }

  public async getStateDiff(key: string, fromTxId: string, toTxId: string): Promise<StateDiff> {
    if (this.mode === 'live') {
      const res = await fetch(`${this.baseUrl}/api/peb/state/${encodeURIComponent(key)}/diff?from=${fromTxId}&to=${toTxId}`);
      if (!res.ok) throw new Error(`Fetch state diff failed: ${res.statusText}`);
      return res.json();
    }

    await this.delay();

    const fromVal = {
      mode: 'EVALUATION',
      max_memory_mb: 1024,
      quarantine_on_violation: false,
      allowed_roles: ['code_executor_role']
    };

    const toVal = MOCK_STATE_VALUES[key] || {
      mode: 'STRICT',
      max_memory_mb: 2048,
      quarantine_on_violation: true,
      allowed_roles: ['code_executor_role', 'security_policy_enforcer'],
      updated_by: 'tx_994a_102'
    };

    return {
      key,
      from_tx_id: fromTxId,
      to_tx_id: toTxId,
      added: { updated_by: 'tx_994a_102' },
      removed: {},
      changed: {
        mode: { from: 'EVALUATION', to: 'STRICT' },
        max_memory_mb: { from: 1024, to: 2048 },
        quarantine_on_violation: { from: false, to: true },
        allowed_roles: {
          from: ['code_executor_role'],
          to: ['code_executor_role', 'security_policy_enforcer']
        }
      },
      from_value: fromVal,
      to_value: toVal
    };
  }

  public subscribeEventStream(
    onEvent: (event: GovernanceEvent) => void,
    onError?: (err: any) => void,
    filters?: { plan_id?: string; agent_role?: string }
  ): () => void {
    if (this.mode === 'live') {
      const query = new URLSearchParams();
      if (filters?.plan_id) query.append('plan_id', filters.plan_id);
      if (filters?.agent_role) query.append('agent_role', filters.agent_role);

      const sse = new EventSource(`${this.baseUrl}/api/peb/events/stream?${query.toString()}`);

      sse.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch (err) {
          console.error('SSE JSON parse error:', err);
        }
      };

      sse.onerror = (err) => {
        if (onError) onError(err);
      };

      return () => {
        sse.close();
      };
    }

    // Mock mode subscriber
    this.mockSseSubscribers.add(onEvent);
    return () => {
      this.mockSseSubscribers.delete(onEvent);
    };
  }

  // Helper to inject a mock violation or custom event directly
  public injectMockEvent(event: Omit<GovernanceEvent, 'id' | 'created_at' | 'replayed_at'>): GovernanceEvent {
    const newEvent: GovernanceEvent = {
      ...event,
      id: (this.eventsStore[0]?.id || 1000) + 1,
      replayed_at: null,
      created_at: new Date().toISOString()
    };
    this.eventsStore.unshift(newEvent);
    this.mockSseSubscribers.forEach((cb) => cb(newEvent));
    return newEvent;
  }
}

export const pebClient = new PebApiClient();
