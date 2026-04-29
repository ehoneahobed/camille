# ADR-001 — Gemini Live ephemeral token (browser)

**Status:** Accepted  
**Date:** 2026-04-28  
**Context:** M1 requires duplex conversation with Gemini Live without exposing the primary Google GenAI API key in the browser.

## Decision

1. **SDK:** `@google/genai` (same package for Node server and browser). Server uses `@google/genai/node`; client uses `@google/genai/web`.
2. **API version:** `v1alpha` for Live (`authTokens.create` + `live.connect`).
3. **Model:** Default `gemini-live-2.5-flash-preview`, overridable via `GEMINI_LIVE_MODEL`.
4. **Token minting:** Server-only `GoogleGenAI` with `GOOGLE_GENAI_API_KEY` or `GEMINI_API_KEY` calls `client.authTokens.create` with `liveConnectConstraints` that pin `model`, `responseModalities`, and `systemInstruction`. The returned token `name` is sent to the client as the **ephemeral API key** passed into `new GoogleGenAI({ apiKey: token, apiVersion: "v1alpha" })` then `ai.live.connect({ model, config: { responseModalities } })`.
5. **Modalities:** Locked at mint time via `GEMINI_LIVE_RESPONSE_MODALITIES` (comma list, default `TEXT`). The client must request the same modalities in `live.connect` or the session will fail.

## Consequences

- **Positive:** Primary API key never ships to the browser; per-session token is short-lived (`uses: 1`, ~30 min expiry in code).
- **Negative:** Token mint adds latency; modality or model changes require a new token.
- **Rate limiting:** Simple per-user cooldown on `POST /api/realtime/token` (see `lib/rate-limit/realtime-token.ts`).

## References

- Implementation: `lib/providers/gemini-live-token.ts`, `app/api/realtime/token/route.ts`, `app/(app)/live/[sessionId]/live-session-panel.tsx`.
