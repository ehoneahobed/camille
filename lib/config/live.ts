/**
 * Gemini Live configuration (see docs/adr/001-gemini-live-ephemeral-token.md).
 */
export const DEFAULT_LIVE_MODEL = "gemini-live-2.5-flash-preview";

export function getGeminiApiKey(): string {
  const key = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Set GOOGLE_GENAI_API_KEY (or GEMINI_API_KEY) for Live API.");
  }
  return key;
}

export function getLiveModelId(): string {
  return process.env.GEMINI_LIVE_MODEL?.trim() || DEFAULT_LIVE_MODEL;
}
