# ADR-003 — Session audio on S3 (chunks + final key)

**Status:** Accepted (M2 partial)  
**Date:** 2026-04-28  
**Context:** PRD M2 requires browser-uploaded audio chunks, a canonical object for diagnostics, and clear separation of environments.

## Decision

1. **Object layout** — Keys live under `{S3_KEY_PREFIX}sessions/{practiceSessionId}/…` where `S3_KEY_PREFIX` is typically `dev/` or `prod/`. Chunks: `chunks/{chunkIndex}.webm`. Canonical merged file (when available): `audio.webm`.
2. **Upload path** — `POST /api/audio/presign` returns a `PUT` target:
   - **`AUDIO_STORAGE_BACKEND=s3` (default):** presigned S3 URL (SigV4). Server uses IAM `s3:PutObject` on the prefix.
   - **`AUDIO_STORAGE_BACKEND=local`:** same client flow, but `PUT /api/audio/chunk/{sessionId}/{chunkIndex}` writes under `LOCAL_AUDIO_DIR` (default `.data/session-audio/`). No AWS in dev; finalize uses `fs` copy like single-chunk S3 finalize.
3. **Finalize on session end** — After `PATCH` sets `ENDED`, `after()` runs `finalizePracticeSessionAudio(sessionId)` (non-blocking for the HTTP response).
4. **Concat strategy (v1)** — **Single chunk:** server `CopyObject` from the lone chunk to `audio.webm`, then set `PracticeSession.audioS3Key`. **Multiple chunks:** no naive byte concat (WebM is EBML); log `[analytics] audio_concat_pending` and leave `audioS3Key` null until a **ffmpeg / Lambda / MediaConvert** job exists (same finalize hook can be extended).
5. **Retention** — Prefer an S3 **lifecycle rule** on `sessions/` (e.g. expire after 30 days). Documented here; not enforced in app code.

## Consequences

- **Positive:** Works without ffmpeg in the Next.js process; single-chunk sessions (common in short tests) get a usable `audioS3Key` immediately.
- **Negative:** Long sessions with multiple 5s slices need a follow-up worker before M3 diagnose-from-audio is reliable.

## References

- `app/api/audio/presign/route.ts`, `app/api/audio/chunk/.../route.ts`, `hooks/use-session-recorder.ts`, `lib/audio/finalize-practice-session.ts`, `lib/s3/finalize-practice-audio-s3.ts`, `lib/storage/local-audio-finalize.ts`, `app/api/sessions/[id]/route.ts`.
