# ADR-004 — Diagnostic job runner

**Status:** Accepted  
**Date:** 2026-04-28  
**Context:** M3 diagnostics must move a `Diagnostic` row from `QUEUED` → `RUNNING` → `DONE` / `FAILED` without blocking the HTTP response that enqueues work.

## Decision

1. **Primary runner:** `after()` from `POST /api/sessions/[id]/diagnose` schedules `runDiagnosticForSession(sessionId)` on the same deployment instance right after the response is sent (Next.js `after` API).
2. **Idempotency:** `runDiagnosticForSession` uses `updateMany` with `where: { sessionId, status: "QUEUED" }` → `RUNNING` so only one concurrent worker processes a given session; duplicate `after()` or cron invocations no-op if nothing is `QUEUED`.
3. **API behaviour:** `DONE` → `POST` returns 200 without re-running. `RUNNING` / `QUEUED` → 202 without enqueueing duplicate `after()` for `QUEUED` (first POST already scheduled work).
4. **Optional cron:** `GET /api/cron/diagnostics` with `Authorization: Bearer CRON_SECRET` loads a small batch of `QUEUED` rows and calls `runDiagnosticForSession` for each, covering stuck queues if `after()` never ran.

## Consequences

- No extra paid queue product for v1; acceptable while diagnostic volume is low.
- Long-running assessments must stay under serverless timeouts; if Azure + Gemini exceed limits, move to a dedicated worker or Inngest / Trigger.dev (revisit ADR).

## Alternatives considered

- **Vercel Cron only:** higher latency to start jobs; rejected as primary path.
- **Inngest / Trigger.dev:** better retries and dashboards; deferred until operational need.
