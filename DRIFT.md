# DRIFT.md — peb-ui Client vs peb-srv API Mismatches

**Date:** 2026-07-23 (updated)
**Compared:** `src/api/pebClient.ts` + `src/types/peb.ts` ↔ `nexus/typescript/peb-srv/src/routes/` (via INTEGRATION.md)
**Status:** 1 residual, 8 resolved, 9 correct endpoints

---

## Resolved (all 8 issues fixed in latest pull)

| Issue | What was wrong | How it was fixed |
|-------|---------------|-----------------|
| **C1** — Base URL | `http://localhost:4206` | → `http://localhost:3111` (`pebClient.ts:32`) |
| **C2** — Health fabricated fields | `version \|\| '1.4.0'`, `uptime_seconds \|\| 0` | Now pass-through (`data.version`, `data.uptime_seconds`), both optional in `ServiceHealth` type. Added `traces: data.counts?.trace_count`. |
| **C3** — Transaction fabricated fields | `duration_ms: t.latency_ms \|\| t.duration_ms \|\| 120`, `agent_role: t.agent_role \|\| 'agent'` | `duration_ms` now computed from `committed_at - created_at` with fallback. `agent_role` passes through from API. Both fields now optional in `Transaction` type. Added `committed_at`, `idempotency_key`, `before_hash`, `after_hash`, `kernel_event_id`, `kernel_event_type`. |
| **C4** — Violations summary shape | 4 fabricated fields with `new Date()` fallbacks | Smart `group_by` detection: `violation_type` only when grouped by `violation_type`, `severity` only when grouped by `severity` with valid key, `entity_id` only when grouped by `entity_id`. `resolved_count` captures `resolved_total`. No fabricated `first_seen`/`last_seen`. All fabricated fields now optional in `ViolationSummary` type. |
| **C5** — Circuit breaker tripped type | `tripped: boolean` (lost count) | `tripped: number \| boolean` preserves real value. Added `isOpen?: boolean` (derived from state OR trip count). Added `state?: 'OPEN' \| 'RECOVERING' \| 'CLOSED'` from API. `tripCount` extracted from `item.tripped` (number) with fallbacks. |
| **M1** — Events `has_more` derivation | `nextCursor !== null && eventsList.length >= limit` | → `nextCursor !== null` only (API returns `null` when no more data) |
| **M2** — Entropy classes hardcoded | `{ STABLE_LOW: 0, NOMINAL: 0, ELEVATED: 0, CRITICAL_HIGH: 0 }` | → `const classes: Record<string, number> = {}` — dynamic, any new server-side class is captured |
| **M3** — Trace status normalization | `(n.status === 'completed' ? 'SUCCESS' : n.status) \|\| 'SUCCESS'` | → `normalizeStatus()` with full mapping: `completed/success/ok/admitted → SUCCESS`, `failed/error/rejected → FAILED`, `skipped → SKIPPED`, unknown → `FAILED` |

---

## Residual

### R1 — `GovernanceEvent.event_type` includes fabricated types

**Current type** (`types/peb.ts`):
```typescript
event_type: 'admission' | 'decision' | 'capability_grant' | 'capability_revoke' | 'violation' | 'circuit_breaker_trip' | 'replay';
```

**Real API** (`GET /api/peb/events?event_type=`):
Only accepts: `admission` | `decision` | `violation` | `circuit_breaker_trip` | `replay`

**Impact:** Low — `capability_grant` and `capability_revoke` are not filtered by the API. If the client sends `?event_type=capability_grant`, it returns all events (unrecognized filter is ignored). No runtime crash, but misleading for developers. Mock engine does use `'capability_grant'` and `'capability_revoke'` in mock data, so removing them would break mock mode.

**Remediation:** Either (a) remove from union and update mock engine to use only real types, or (b) keep as-is since mock mode uses them and live mode ignores unrecognized filters.

---

## Correct Endpoints (no changes needed)

| Method | Verdict |
|--------|---------|
| `getEventByReceipt()` | ✅ Unwraps `data.event` correctly |
| `replayEvent()` | ✅ Unwraps `data.replayed` correctly |
| `getLineage()` | ✅ Maps all 7 response fields |
| `getDecisionChain()` | ✅ Unwraps `data.chain` correctly |
| `getCapabilityGap()` | ✅ Unwraps `data.capability_gaps` correctly |
| `getCapabilities()` | ✅ Unwraps `data.capabilities` correctly |
| `getStateVersions()` | ✅ Unwraps `data.historical_versions` correctly |
| `getStateDiff()` | ✅ Unwraps `data.diff` correctly |
| `subscribeEventStream()` | ✅ Correct EventSource URL + query params |
| `getTransaction()` (single) | ✅ Maps all real fields + computes `duration_ms` from timestamps |
| `getLineage()` deep fields | ✅ `violations_raised` maps correctly |

---

## Files No Longer Drifting

| File | Status |
|------|--------|
| `src/api/pebClient.ts` | ✅ All 8 issues resolved |
| `src/types/peb.ts` | ✅ All 8 type drifts resolved (1 residual non-critical) |
| `INTEGRATION.md` | ⚠️ Still references port 4206 — needs update to 3111 |
