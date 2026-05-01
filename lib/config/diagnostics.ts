/**
 * Gemini model for offline diagnostic passes (grammar, vocabulary, optional pronunciation).
 * Live sessions use `GEMINI_LIVE_MODEL`; keep diagnostics on a stable Flash SKU by default.
 */
export const DEFAULT_GEMINI_DIAGNOSTIC_MODEL = "gemini-2.5-flash";

export function getGeminiDiagnosticModelId(): string {
  const raw = process.env.GEMINI_DIAGNOSTIC_MODEL?.trim();
  return raw || DEFAULT_GEMINI_DIAGNOSTIC_MODEL;
}

export type AzureSpeechCredentials = {
  subscriptionKey: string;
  region: string;
};

/**
 * Azure Speech (pronunciation assessment via short-audio REST) — optional.
 * @see https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short
 */
export function getAzureSpeechCredentials(): AzureSpeechCredentials | null {
  const subscriptionKey =
    process.env.AZURE_SPEECH_KEY?.trim() ||
    process.env.AZURE_SPEECH_SUBSCRIPTION_KEY?.trim() ||
    "";
  const region = process.env.AZURE_SPEECH_REGION?.trim() || "";
  if (!subscriptionKey || !region) {
    return null;
  }
  return { subscriptionKey, region };
}
