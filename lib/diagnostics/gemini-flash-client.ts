import { GoogleGenAI } from "@google/genai/node";
import { getGeminiDiagnosticModelId } from "@/lib/config/diagnostics";
import { getGeminiApiKey } from "@/lib/config/live";

let cached: { key: string; client: GoogleGenAI } | null = null;

export function getDiagnosticsGenAI(): GoogleGenAI {
  const key = getGeminiApiKey();
  if (cached?.key === key) {
    return cached.client;
  }
  const client = new GoogleGenAI({ apiKey: key });
  cached = { key, client };
  return client;
}

export function getDiagnosticsModel(): string {
  return getGeminiDiagnosticModelId();
}
