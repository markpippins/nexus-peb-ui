# DRIFT.md — peb-ui Client vs peb-srv API Mismatches

**Date:** 2026-07-23
**Compared:** `src/api/pebClient.ts` + `src/types/peb.ts` ↔ `nexus/typescript/peb-srv/src/routes/` (via INTEGRATION.md)
**Status:** 5 critical, 3 medium, 9 correct endpoints

---

## Critical (data silently wrong or falling back to defaults)

### C1 — Base URL: `localhost:4206` → should be `3111`

| Location | Current | Correct |
|----------|---------|---------|
| `pebClient.ts:32` | `'http://localhost:4206'` | `'http://localhost:3111'` |
| `INTEGRATION.md` (throughout) | `http://localhost:4206` | `http://localhost:3111` |

**Impact:** Every live-mode call fails until the user manually changes the URL in Settings. peb-srv has never run on 4206 — that port appears to be a stub from early development.

**Remediation:** Change default in `pebClient.ts` line 32. Update all examples in `INTEGRATION.md`.

---

### C2 — `getHealth()`: fabricates `version` and `uptime_seconds`

**Real API** (`GET /health`):
```json
{ "status": "healthy", "counts": { "event_count": 18420, "transaction_count": 5100, "violation_count": 32, "decision_count": 1200, "trace_count": 8900, "circuit_breakers_tripped": 2 } }
```

**Client maps** (`pebClient.ts:100-109`):
```typescript
return {
  status: (data.status === 'healthy' ? 'ok' : data.status) || 'ok',
  version: data.version || '1.4.0',          // ← DOES NOT EXIST in API
  uptime_seconds: data.uptime_seconds || 0,   // ← DOES NOT EXIST in API
  counts: {
    governance_events: data.counts?.event_count ?? data.counts?.governance_events ?? 0,
    transactions: data.counts?.transaction_count ?? data.counts?.transactions ?? 0,
    decisions: data.counts?.decision_count ?? data.counts?.decisions ?? 0,
    active_circuit_breakers: data.counts?.circuit_breakers_tripped ?? data.counts?.active_circuit_breakers ?? 0,
    violations_24h: data.counts?.violation_count ?? data.counts?.violations_24h ?? 0
  }
};
```

**Impact:** `version` always `'1.4.0'`, `uptime_seconds` always `0`. The `ServiceHealth` type declares fields the API doesn't provide.

**Remediation:** Either (a) remove `version`/`uptime_seconds` from `ServiceHealth` type and client mapping, or (b) add them to peb-srv's `/health` response. Option (a) is simpler — UI can display `data.counts` directly.

---

### C3 — `getTransactions()`: fabricates `duration_ms` and `agent_role`

**Real API** (`GET /api/peb/transactions`):
```json
{ "transactions": [{ "id", "idempotency_key", "entity_id", "admission_result", "tool_name", "input", "output", "before_hash", "after_hash", "state_delta", "created_at", "committed_at", "kernel_event_id", "kernel_event_type" }] }
```

**Client maps** (`pebClient.ts:246-254`):
```typescript
return items.map((t: any) => ({
  // ...correct fields...
  duration_ms: t.latency_ms || t.duration_ms || 120,  // ← NEITHER exists in API
  agent_role: t.agent_role || 'agent'                   // ← DOES NOT EXIST in API
}));
```

**Impact:** Every transaction shows `duration_ms: 120` and `agent_role: 'agent'` regardless of reality. The transaction list and lineage views show fabricated latency and agent data.

**Remediation:** Remove `duration_ms`/`agent_role` mapping. For latency, use `created_at` and `committed_at` to compute `duration_ms` client-side. For agent role, the field simply isn't on the transaction record — use `entity_id` or remove the column from the UI.

---

### C4 — `getViolationsSummary()`: complete response shape mismatch

**Real API** (`GET /api/peb/health/violations/summary`):
```json
{ "group_by": "severity", "window": "24h", "summary": [
  { "key": "CRITICAL", "total": 14, "resolved_total": 10 }
]}
```

**Client expects** (`pebClient.ts:198-209`):
```typescript
return items.map((item: any) => ({
  group_key: item.key || item.group_key || 'UNKNOWN',
  violation_type: item.violation_type || item.key || 'POLICY_VIOLATION',  // ← doesn't exist
  severity: (item.key as Severity) || item.severity || 'WARNING',         // ← key IS severity only if group_by=severity
  entity_id: item.entity_id || 'system',                                   // ← doesn't exist
  count: item.total ?? item.count ?? 0,
  first_seen: item.first_seen || new Date().toISOString(),                 // ← doesn't exist
  last_seen: item.last_seen || new Date().toISOString()                    // ← doesn't exist
}));
```

**Impact:** 4 of 7 `ViolationSummary` fields are fabricated. `first_seen` and `last_seen` are always `now()`. `entity_id` is always `'system'`. When `group_by` is anything other than `severity`, the `key` field is not a valid `Severity` value but gets cast as one.

**Remediation:** Redesign `ViolationSummary` type to match the real API shape (`group_key`, `count`, `resolved_count`). Remove fabricated fields or derive them from other endpoints. The `resolved_total` field from the API is not even captured — that's a loss of real data.

---

### C5 — `getCircuitBreakers()`: `tripped` is a count, not a boolean

**Real API** (`GET /api/peb/health/circuit-breakers`):
```json
{ "circuit_breakers": [{ "role": "db_migration_agent", "tripped": 3, "tripped_at": "...", "retry_after": 3600, "error": "...", "failure_count": 3, "updated_at": "...", "state": "OPEN" }] }
```

**Client type** (`types/peb.ts`):
```typescript
export interface CircuitBreakerStatus {
  tripped: boolean;   // ← API returns number (trip count)
  trip_count: number; // ← separate field
}
```

**Client maps** (`pebClient.ts:182`):
```typescript
tripped: typeof item.tripped === 'boolean' ? item.tripped : (item.state === 'OPEN' || Number(item.tripped) > 0),
```

**Impact:** The trip count is lost — a breaker that tripped 12 times looks the same as one that tripped once. The `CircuitBreakerStatus.tripped: boolean` type guarantees this data is discarded.

**Remediation:** Change `CircuitBreakerStatus.tripped` to `number` (trip count) and add a derived `isOpen: boolean` from `state === 'OPEN'`. Preserve `failure_count` (already mapped to `active_violations`).

---

## Medium (fallback logic works but suboptimal)

### M1 — `getEvents()`: `has_more` not in real API

**Real API** returns `{ events, next_cursor, limit, offset }` — no `has_more` boolean.

**Client** (`pebClient.ts:132`):
```typescript
const hasMore = typeof data.has_more === 'boolean'
  ? data.has_more
  : (nextCursor !== null && eventsList.length >= (params?.limit || 20));
```

**Impact:** Low — the fallback is correct. But the `has_more` property in the return type is always derived, never from the API. If the last page has exactly `limit` items, the fallback incorrectly reports `has_more: true` (no way to distinguish "more data" from "exactly one page").

**Remediation:** Compute `hasMore` from `next_cursor !== null` alone (the API returns `null` for `next_cursor` when there's no more data). Remove the `eventsList.length >= limit` check — it's unreliable.

---

### M2 — `getEntropy()`: hardcoded 4-class record

**Client** (`pebClient.ts:220-227`):
```typescript
const classes: Record<string, number> = {
  STABLE_LOW: 0, NOMINAL: 0, ELEVATED: 0, CRITICAL_HIGH: 0
};
data.summary.forEach((s: any) => {
  classes[s.key] = s.total || s.count || 0;
});
```

**Impact:** Low currently — the real API appears to return only these 4 classes. But if a new entropy class is added server-side, it silently drops from the dashboard with no error.

**Remediation:** Initialize `classes` as `Record<string, number>` without hardcoded keys. Use `Object.keys(classes)` in the UI for dynamic rendering instead of assuming 4 specific keys exist.

---

### M3 — `getTraceTree()`: status normalization incomplete

**Real API** trace nodes have `status: "completed"` (lowercase).

**Client** (`pebClient.ts:346`):
```typescript
status: (n.status === 'completed' ? 'SUCCESS' : n.status) || 'SUCCESS'
```

**Impact:** Real API values like `"failed"` or `"running"` pass through unchanged, creating values outside the `'SUCCESS' | 'FAILED' | 'SKIPPED'` union. The runtime normalization is the only safeguard — JSON.parse returns `string`, so values that don't match `'completed'` bypass the mapping entirely.

**Remediation:** Add a proper status mapping: `{ completed: 'SUCCESS', failed: 'FAILED', skipped: 'SKIPPED' }`. Default unknown statuses to `'FAILED'` rather than passing through.

---

## Correct Endpoints (no changes needed)

| Method | Verdict |
|--------|---------|
| `getEventByReceipt()` | ✅ Unwraps `data.event` correctly |
| `replayEvent()` | ✅ Unwraps `data.replayed` correctly |
| `getLineage()` | ✅ Maps all 7 response fields (`decisions`, `decision_chain`, `traces`, `traces_tree`, `governance_events`, `violations`, `transaction`) |
| `getDecisionChain()` | ✅ Unwraps `data.chain` correctly |
| `getCapabilityGap()` | ✅ Unwraps `data.capability_gaps`, `data.summary` correctly |
| `getCapabilities()` | ✅ Unwraps `data.capabilities` correctly |
| `getStateVersions()` | ✅ Unwraps `data.historical_versions` correctly |
| `getStateDiff()` | ✅ Unwraps `data.diff` correctly |
| `subscribeEventStream()` | ✅ Correct EventSource URL + query params |
| `getTransaction()` (single) | ✅ Maps all real fields including `idempotency_key`, `input`, `output`, `before_hash`, `after_hash`, `committed_at`, `kernel_event_id`, `kernel_event_type` |
| `getLineage()` deep fields | ✅ `violations_raised` maps from `data.violations` with correct field extraction |

---

## Type Drift (`src/types/peb.ts`)

The following interfaces have fields that don't exist in the real API or are differently shaped:

| Type | Field | Issue |
|------|-------|-------|
| `ServiceHealth` | `version: string` | Doesn't exist in API |
| `ServiceHealth` | `uptime_seconds: number` | Doesn't exist in API |
| `ServiceHealth.counts` | `governance_events` | API calls it `event_count` |
| `ServiceHealth.counts` | `violations_24h` | API calls it `violation_count` |
| `CircuitBreakerStatus` | `tripped: boolean` | API returns `number` (trip count) |
| `CircuitBreakerStatus` | `threshold: number` | Not in API response |
| `ViolationSummary` | `violation_type` | Doesn't exist in API |
| `ViolationSummary` | `entity_id` | Doesn't exist in API |
| `ViolationSummary` | `first_seen` | Doesn't exist in API |
| `ViolationSummary` | `last_seen` | Doesn't exist in API |
| `Transaction` | `duration_ms` | Doesn't exist in API |
| `Transaction` | `agent_role` | Doesn't exist in API |
| `GovernanceEvent` | `event_type` union | Includes `'capability_grant'` and `'capability_revoke'` — these are fabricated types not in the real API's supported `event_type` filter values (`admission`, `decision`, `violation`, `circuit_breaker_trip`, `replay`) |

---

## Remediation Order (priority)

1. **C1** — Fix base URL (one-line change, unblocks live mode entirely)
2. **C2** — Fix health response mapping (remove fabricated fields)
3. **C4** — Fix violations summary mapping (total shape mismatch, most data lost)
4. **C3** — Fix transaction mapping (remove `duration_ms`/`agent_role`, compute latency)
5. **C5** — Fix circuit breaker tripped type (preserve count data)
6. **M1** — Fix events `has_more` derivation
7. **M2** — Dynamic entropy classes
8. **M3** — Trace status normalization

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/api/pebClient.ts` | C1-C5 + M1-M3: remap 5 methods, fix base URL |
| `src/types/peb.ts` | Align 6 interfaces with real API shapes |
| `INTEGRATION.md` | C1: fix base URL in all examples |
