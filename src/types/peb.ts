/**
 * Types matching the PEB (Persistent Engineering Brain) Governance Schema
 * as exposed by peb-srv REST API.
 */

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL' | 'FATAL';

export type ThemeMode = 'dark' | 'steel' | 'light';

export type EntropyClass = 'STABLE_LOW' | 'NOMINAL' | 'ELEVATED' | 'CRITICAL_HIGH';

export type GapStatus = 'active' | 'lapsed' | 'missing';

export type AdmissionResult = 'ADMITTED' | 'REJECTED' | 'QUARANTINED' | 'OVERRIDDEN';

export interface GovernanceEvent {
  id: number;
  receipt_id: string;
  event_type: 'admission' | 'decision' | 'capability_grant' | 'capability_revoke' | 'violation' | 'circuit_breaker_trip' | 'replay';
  plan_id: string;
  agent_role: string;
  work_request_id: string;
  payload: Record<string, any>;
  replayed_at: string | null;
  created_at: string;
}

export interface CircuitBreakerStatus {
  role: string;
  tripped: boolean;
  trip_count: number;
  last_tripped_at: string | null;
  threshold: number;
  active_violations: number;
  cooldown_seconds: number;
}

export interface ViolationSummary {
  group_key: string;
  violation_type: string;
  severity: Severity;
  entity_id: string;
  count: number;
  first_seen: string;
  last_seen: string;
}

export interface EntropyPoint {
  date: string;
  entropy_class: EntropyClass;
  count: number;
  author_id: string;
}

export interface EntropyRollup {
  classes: Record<EntropyClass, number>;
  trend: EntropyPoint[];
  total_decisions: number;
}

export interface Transaction {
  id: string; // e.g. tx_994a_102
  entity_id: string;
  tool_name: string;
  admission_result: AdmissionResult;
  state_delta: Record<string, any>;
  keys?: string[];
  created_at: string;
  duration_ms: number;
  agent_role: string;
}

export interface DecisionChainNode {
  id: string;
  parent_decision_id: string | null;
  rollback_of: string | null;
  entropy_class: EntropyClass;
  author_id: string;
  summary: string;
  rationale: string;
  created_at: string;
}

export interface TraceTreeNode {
  id: string;
  trace_id: string;
  parent_id: string | null;
  name: string;
  confidence: number; // 0.0 to 1.0
  rejected_alternatives: Array<{
    option: string;
    reason: string;
    score: number;
  }>;
  metadata: Record<string, any>;
  children?: TraceTreeNode[];
  duration_ms: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
}

export interface CapabilityGrant {
  id: string;
  entity_id: string;
  capability: string;
  granted_by: string;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface CapabilityGapItem {
  entity_id: string;
  capability_attempted: string;
  violation_id: string;
  violation_created_at: string;
  gap_status: GapStatus;
  matching_grant?: CapabilityGrant;
  notes: string;
}

export interface LineagePayload {
  transaction: Transaction;
  parent_transactions: Transaction[];
  decisions: DecisionChainNode[];
  capabilities_checked: CapabilityGrant[];
  violations_raised: Array<{
    id: string;
    violation_type: string;
    severity: Severity;
    capability_attempted: string;
    created_at: string;
  }>;
}

export interface StateVersion {
  version: number;
  tx_id: string;
  author_id: string;
  agent_role: string;
  created_at: string;
  checksum: string;
  delta_summary: string;
  keys_modified: string[];
}

export interface StateDiff {
  key: string;
  from_tx_id: string;
  to_tx_id: string; // or 'current'
  added: Record<string, any>;
  removed: Record<string, any>;
  changed: Record<string, { from: any; to: any }>;
  from_value: any;
  to_value: any;
}

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  uptime_seconds: number;
  counts: {
    governance_events: number;
    transactions: number;
    decisions: number;
    active_circuit_breakers: number;
    violations_24h: number;
  };
}
