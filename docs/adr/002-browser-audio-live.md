# ADR-002 — Browser audio + Live (M1 scope)

**Status:** Proposed (M1 partial)  
**Date:** 2026-04-28  
**Context:** PRD M1 calls for duplex audio; M1-S02 asks for a browser matrix (`getUserMedia`, codecs, Gemini Live).

## Current state (M1 ship)

- The live UI uses **typed text** to the model and **TEXT** (or optional `AUDIO`) response modalities from env.
- **Microphone input to Live** is not wired in the first M1 UI pass; enabling `AUDIO` modality alone does not replace user text capture.

## Next steps (M2+)

- Fork or share one `MediaStream` between Gemini Live input configuration and `MediaRecorder` (S3 chunks) per PRD M2.
- Document Chrome / Safari / Firefox matrix and chosen codec after the spike.

## References

- Client shell: `components/live/live-session-panel.tsx` (route: `app/(immersive)/live/[sessionId]/page.tsx`).
