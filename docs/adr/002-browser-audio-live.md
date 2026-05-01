# ADR-002 — Browser audio + Live (M1 scope)

**Status:** Accepted (updated M1)  
**Date:** 2026-04-28  
**Context:** PRD M1 calls for duplex audio; M1-S02 asks for a browser matrix (`getUserMedia`, codecs, Gemini Live).

## Current state (M1 ship)

- **`GEMINI_LIVE_RESPONSE_MODALITIES`** — default remains **`TEXT`** for predictable dogfood. Set **`TEXT,AUDIO`** (or **`AUDIO`**) for voice duplex: the server maps any config that includes **`AUDIO`** to **`responseModalities: [AUDIO]`** only (native-audio Live); captions come from **`outputAudioTranscription`** / `serverContent.outputTranscription`. Client streams **16 kHz PCM** via `sendRealtimeInput({ audio })` (`hooks/use-live-realtime-mic.ts`), plays model **24 kHz PCM** from `inlineData` (`lib/live/model-pcm-playback.ts`). Learner speech is persisted from **`inputAudioTranscription`** / `serverContent.inputTranscription` (batched with the following assistant `turnComplete`, or flushed when `finished` is true).
- **Ephemeral token** — when `AUDIO` is included, mint adds `inputAudioTranscription` / `outputAudioTranscription` (`lib/providers/gemini-live-token.ts`); browser `live.connect` mirrors the same flags.
- **MediaRecorder** still shares the same `MediaStream` for session chunks (M2); no second mic capture.

## Next steps (M2+)

- Document Chrome / Safari / Firefox matrix and failure modes after field testing `TEXT,AUDIO`.
- Optional: persist **input transcription** as `USER` turns when only speaking (today typed + help lines persist; speech transcript UI can follow).

## References

- Client shell: `components/live/live-session-panel.tsx` (route: `app/(immersive)/live/[sessionId]/page.tsx`).
