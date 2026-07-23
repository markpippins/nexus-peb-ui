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

export const INITIAL_HEALTH: ServiceHealth = {
  status: 'ok',
  version: '1.4.2-peb-srv',
  uptime_seconds: 142850,
  counts: {
    governance_events: 18420,
    transactions: 12405,
    decisions: 6810,
    active_circuit_breakers: 2,
    violations_24h: 37
  }
};

export const MOCK_CIRCUIT_BREAKERS: CircuitBreakerStatus[] = [
  {
    role: 'code_executor_role',
    tripped: true,
    trip_count: 14,
    last_tripped_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    threshold: 5,
    active_violations: 8,
    cooldown_seconds: 300
  },
  {
    role: 'db_migration_agent',
    tripped: true,
    trip_count: 3,
    last_tripped_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    threshold: 3,
    active_violations: 4,
    cooldown_seconds: 600
  },
  {
    role: 'security_policy_enforcer',
    tripped: false,
    trip_count: 1,
    last_tripped_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    threshold: 10,
    active_violations: 1,
    cooldown_seconds: 120
  },
  {
    role: 'release_pipeline_agent',
    tripped: false,
    trip_count: 0,
    last_tripped_at: null,
    threshold: 5,
    active_violations: 0,
    cooldown_seconds: 180
  },
  {
    role: 'telemetry_collector',
    tripped: false,
    trip_count: 2,
    last_tripped_at: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(),
    threshold: 20,
    active_violations: 0,
    cooldown_seconds: 60
  }
];

export const MOCK_VIOLATIONS_SUMMARY: ViolationSummary[] = [
  {
    group_key: 'UNAUTHORIZED_CAPABILITY_ACCESS',
    violation_type: 'UNAUTHORIZED_CAPABILITY_ACCESS',
    severity: 'CRITICAL',
    entity_id: 'agent:runner-pod-99',
    count: 18,
    first_seen: new Date(Date.now() - 1000 * 3600 * 20).toISOString(),
    last_seen: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  },
  {
    group_key: 'RATE_LIMIT_EXCEEDED',
    violation_type: 'RATE_LIMIT_EXCEEDED',
    severity: 'WARNING',
    entity_id: 'agent:db-migrator-01',
    count: 11,
    first_seen: new Date(Date.now() - 1000 * 3600 * 14).toISOString(),
    last_seen: new Date(Date.now() - 1000 * 60 * 32).toISOString()
  },
  {
    group_key: 'STATE_DESYNC_DETECTED',
    violation_type: 'STATE_DESYNC_DETECTED',
    severity: 'FATAL',
    entity_id: 'entity:nexus-core-ledger',
    count: 3,
    first_seen: new Date(Date.now() - 1000 * 3600 * 8).toISOString(),
    last_seen: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  },
  {
    group_key: 'POLICY_EVALUATION_TIMEOUT',
    violation_type: 'POLICY_EVALUATION_TIMEOUT',
    severity: 'INFO',
    entity_id: 'agent:policy-check-3',
    count: 5,
    first_seen: new Date(Date.now() - 1000 * 3600 * 22).toISOString(),
    last_seen: new Date(Date.now() - 1000 * 3600 * 3).toISOString()
  }
];

export const MOCK_ENTROPY: EntropyRollup = {
  classes: {
    STABLE_LOW: 4120,
    NOMINAL: 2150,
    ELEVATED: 480,
    CRITICAL_HIGH: 60
  },
  total_decisions: 6810,
  trend: Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const dayStr = d.toISOString().split('T')[0];
    return {
      date: dayStr,
      entropy_class: idx > 10 ? 'ELEVATED' : 'STABLE_LOW',
      count: Math.floor(300 + Math.random() * 200 + idx * 15),
      author_id: `agent:lead-orchestrator-${idx % 3}`
    };
  })
};

const AGENT_ROLES = [
  'code_executor_role',
  'db_migration_agent',
  'security_policy_enforcer',
  'release_pipeline_agent',
  'telemetry_collector'
];

export function generateInitialEvents(): GovernanceEvent[] {
  const events: GovernanceEvent[] = [];
  const now = Date.now();

  const types: GovernanceEvent['event_type'][] = [
    'admission',
    'decision',
    'capability_grant',
    'violation',
    'circuit_breaker_trip',
    'capability_revoke'
  ];

  for (let i = 50; i >= 1; i--) {
    const time = new Date(now - i * 1000 * 45).toISOString();
    const type = types[i % types.length];
    const role = AGENT_ROLES[i % AGENT_ROLES.length];
    const receiptId = `rcpt_${Math.floor(100000 + Math.random() * 900000)}_${type.substring(0, 4)}`;

    events.push({
      id: 1000 + (50 - i),
      receipt_id: receiptId,
      event_type: type,
      plan_id: `plan_nexus_00${(i % 5) + 1}`,
      agent_role: role,
      work_request_id: `wrk_${800 + i}`,
      payload: {
        admission_status: type === 'violation' ? 'DENIED' : 'ADMITTED',
        reason: type === 'violation' ? 'Attempted capability exec:raw_sql without grant' : 'Policy rules pass OK',
        risk_score: Math.round(Math.random() * 100) / 100,
        keys_touched: ['governance.policy.v2', 'agent.context.env']
      },
      replayed_at: i === 12 ? new Date(now - 1000 * 300).toISOString() : null,
      created_at: time
    });
  }

  return events;
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_994a_102',
    entity_id: 'agent:runner-pod-99',
    tool_name: 'exec_container_script',
    admission_result: 'ADMITTED',
    state_delta: {
      'governance.policy.v2': { mode: 'STRICT', max_memory_mb: 2048 },
      'agent.context.env': { region: 'us-west1', debug: false }
    },
    keys: ['governance.policy.v2', 'agent.context.env'],
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    duration_ms: 124,
    agent_role: 'code_executor_role'
  },
  {
    id: 'tx_994a_101',
    entity_id: 'agent:db-migrator-01',
    tool_name: 'apply_schema_patch',
    admission_result: 'REJECTED',
    state_delta: {
      'governance.policy.v2': { mode: 'EVALUATION', max_memory_mb: 1024 }
    },
    keys: ['governance.policy.v2'],
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    duration_ms: 310,
    agent_role: 'db_migration_agent'
  },
  {
    id: 'tx_994a_100',
    entity_id: 'agent:runner-pod-99',
    tool_name: 'grant_ephemeral_token',
    admission_result: 'ADMITTED',
    state_delta: {
      'capability.matrix.core': { granted: ['fs:read', 'fs:write', 'net:outbound'] }
    },
    keys: ['capability.matrix.core'],
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    duration_ms: 88,
    agent_role: 'security_policy_enforcer'
  },
  {
    id: 'tx_994a_099',
    entity_id: 'agent:release-agent',
    tool_name: 'promote_build_artifact',
    admission_result: 'QUARANTINED',
    state_delta: {
      'release.tag': 'v2.8.0-rc1',
      'governance.policy.v2': { mode: 'STRICT', quarantine_reason: 'Unverified hash signature' }
    },
    keys: ['release.tag', 'governance.policy.v2'],
    created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    duration_ms: 450,
    agent_role: 'release_pipeline_agent'
  }
];

export const MOCK_DECISIONS_CHAIN: DecisionChainNode[] = [
  {
    id: 'dec_8810_root',
    parent_decision_id: null,
    rollback_of: null,
    entropy_class: 'STABLE_LOW',
    author_id: 'agent:security-policy-enforcer',
    summary: 'Initialize PEB baseline security boundary for work_request wrk_850',
    rationale: 'Verified cryptographic provenance of plan plan_nexus_001',
    created_at: new Date(Date.now() - 1000 * 3600 * 4).toISOString()
  },
  {
    id: 'dec_8811_child',
    parent_decision_id: 'dec_8810_root',
    rollback_of: null,
    entropy_class: 'NOMINAL',
    author_id: 'agent:code-executor-role',
    summary: 'Grant ephemeral fs:read and fs:write token for pod runner-pod-99',
    rationale: 'Required to unpack workspace bundle prior to execution',
    created_at: new Date(Date.now() - 1000 * 3600 * 3).toISOString()
  },
  {
    id: 'dec_8812_escalate',
    parent_decision_id: 'dec_8811_child',
    rollback_of: null,
    entropy_class: 'ELEVATED',
    author_id: 'agent:runner-pod-99',
    summary: 'Attempt unadmitted capability exec:raw_sql',
    rationale: 'Automated index fix suggested by query optimizer',
    created_at: new Date(Date.now() - 1000 * 3600 * 1).toISOString()
  },
  {
    id: 'dec_8813_rollback',
    parent_decision_id: 'dec_8812_escalate',
    rollback_of: 'dec_8812_escalate',
    entropy_class: 'CRITICAL_HIGH',
    author_id: 'agent:circuit-breaker-engine',
    summary: 'Trip circuit breaker code_executor_role and revert transaction tx_994a_101',
    rationale: 'Violation threshold reached (14 trips in 24h window). Force safety rollback.',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  }
];

export const MOCK_TRACE_TREE: TraceTreeNode = {
  id: 'node_root_01',
  trace_id: 'trc_nexus_7721',
  parent_id: null,
  name: 'PEB Transaction Pipeline [wrk_850]',
  confidence: 0.98,
  duration_ms: 540,
  status: 'SUCCESS',
  metadata: { plan_id: 'plan_nexus_001', agent_role: 'code_executor_role' },
  rejected_alternatives: [],
  children: [
    {
      id: 'node_policy_eval',
      trace_id: 'trc_nexus_7721',
      parent_id: 'node_root_01',
      name: 'Evaluate Governance Policies',
      confidence: 0.94,
      duration_ms: 120,
      status: 'SUCCESS',
      metadata: { policy_set: 'v2.4-strict' },
      rejected_alternatives: [
        {
          option: 'v1-legacy-permissive',
          reason: 'Deprecated due to CVE-2026-8819',
          score: 0.22
        }
      ],
      children: [
        {
          id: 'node_cap_check',
          trace_id: 'trc_nexus_7721',
          parent_id: 'node_policy_eval',
          name: 'Capability Overlay Verification',
          confidence: 0.42,
          duration_ms: 45,
          status: 'FAILED',
          metadata: { capability_attempted: 'exec:raw_sql', entity: 'agent:runner-pod-99' },
          rejected_alternatives: [
            {
              option: 'Auto-approve ephemeral grant',
              reason: 'Circuit breaker is TRIPPED for code_executor_role',
              score: 0.05
            }
          ]
        }
      ]
    },
    {
      id: 'node_state_patch',
      trace_id: 'trc_nexus_7721',
      parent_id: 'node_root_01',
      name: 'State Delta Patch Builder',
      confidence: 0.91,
      duration_ms: 180,
      status: 'SUCCESS',
      metadata: { key_touched: 'governance.policy.v2', patch_type: 'shallow_merge' },
      rejected_alternatives: [
        {
          option: 'Full overwrite peb.state',
          reason: 'Violates ledger append-only immutability invariant',
          score: 0.1
        }
      ]
    }
  ]
};

export const MOCK_CAPABILITY_GAP: CapabilityGapItem[] = [
  {
    entity_id: 'agent:runner-pod-99',
    capability_attempted: 'exec:raw_sql',
    violation_id: 'viol_8801',
    violation_created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    gap_status: 'missing',
    notes: 'No capability grant ever existed for entity agent:runner-pod-99 + capability exec:raw_sql.'
  },
  {
    entity_id: 'agent:runner-pod-99',
    capability_attempted: 'net:outbound:port_443',
    violation_id: 'viol_8802',
    violation_created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    gap_status: 'lapsed',
    matching_grant: {
      id: 'grant_3301',
      entity_id: 'agent:runner-pod-99',
      capability: 'net:outbound:port_443',
      granted_by: 'security_policy_enforcer',
      active: false,
      created_at: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
      expires_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
    },
    notes: 'Capability grant existed but expired 2 hours prior to attempt.'
  },
  {
    entity_id: 'agent:runner-pod-99',
    capability_attempted: 'fs:read',
    violation_id: 'viol_8803',
    violation_created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    gap_status: 'active',
    matching_grant: {
      id: 'grant_3302',
      entity_id: 'agent:runner-pod-99',
      capability: 'fs:read',
      granted_by: 'security_policy_enforcer',
      active: true,
      created_at: new Date(Date.now() - 1000 * 3600 * 10).toISOString(),
      expires_at: null
    },
    notes: 'Active grant exists! Violation is a deliberate overstep or invalid parameters.'
  }
];

export const MOCK_STATE_VERSIONS: Record<string, StateVersion[]> = {
  'governance.policy.v2': [
    {
      version: 1,
      tx_id: 'tx_994a_080',
      author_id: 'agent:lead-orchestrator-0',
      agent_role: 'security_policy_enforcer',
      created_at: new Date(Date.now() - 1000 * 3600 * 72).toISOString(),
      checksum: 'sha256:7f8a8109a2',
      delta_summary: 'Initial governance policy configuration',
      keys_modified: ['governance.policy.v2']
    },
    {
      version: 2,
      tx_id: 'tx_994a_099',
      author_id: 'agent:release-agent',
      agent_role: 'release_pipeline_agent',
      created_at: new Date(Date.now() - 1000 * 3600 * 12).toISOString(),
      checksum: 'sha256:88910b21c4',
      delta_summary: 'Enforce STRICT mode and set max memory limit',
      keys_modified: ['governance.policy.v2', 'release.tag']
    },
    {
      version: 3,
      tx_id: 'tx_994a_102',
      author_id: 'agent:runner-pod-99',
      agent_role: 'code_executor_role',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      checksum: 'sha256:e321a4f910',
      delta_summary: 'Update execution bounds & region tags',
      keys_modified: ['governance.policy.v2', 'agent.context.env']
    }
  ],
  'agent.context.env': [
    {
      version: 1,
      tx_id: 'tx_994a_090',
      author_id: 'agent:telemetry-collector',
      agent_role: 'telemetry_collector',
      created_at: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
      checksum: 'sha256:112009ab44',
      delta_summary: 'Set default region us-west1',
      keys_modified: ['agent.context.env']
    },
    {
      version: 2,
      tx_id: 'tx_994a_102',
      author_id: 'agent:runner-pod-99',
      agent_role: 'code_executor_role',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      checksum: 'sha256:e321a4f910',
      delta_summary: 'Disable debug mode in runtime context',
      keys_modified: ['agent.context.env']
    }
  ]
};

export const MOCK_STATE_VALUES: Record<string, any> = {
  'governance.policy.v2': {
    mode: 'STRICT',
    max_memory_mb: 2048,
    quarantine_on_violation: true,
    allowed_roles: ['code_executor_role', 'security_policy_enforcer'],
    updated_by: 'tx_994a_102'
  },
  'agent.context.env': {
    region: 'us-west1',
    debug: false,
    environment: 'production',
    cluster_id: 'nexus-cluster-alpha'
  }
};
