import { Modality } from "@google/genai/node";

/**
 * Maps `GEMINI_LIVE_RESPONSE_MODALITIES` to Live `responseModalities` for token mint and `live.connect`.
 *
 * Native-audio Live models expect **AUDIO-only** when speech output is enabled. Captions are delivered via
 * `outputAudioTranscription` / `serverContent.outputTranscription`, not as a separate `TEXT` modality.
 * Combining `TEXT` + `AUDIO` has been observed to close the socket with code 1011 ("Internal error").
 */
export function liveResponseModalitiesFromEnv(): Modality[] {
  const raw = process.env.GEMINI_LIVE_RESPONSE_MODALITIES ?? "TEXT";
  const parts = raw.split(",").map((s) => s.trim().toUpperCase());
  const wantsAudio = parts.some((p) => p === "AUDIO" || p.endsWith(".AUDIO"));
  if (wantsAudio) {
    return [Modality.AUDIO];
  }
  const wantsText = parts.some((p) => p === "TEXT" || p.endsWith(".TEXT"));
  if (wantsText || parts.length === 0) {
    return [Modality.TEXT];
  }
  return [Modality.TEXT];
}
