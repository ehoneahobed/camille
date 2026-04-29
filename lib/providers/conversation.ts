/**
 * Thin boundary for realtime conversation providers (PRD §10.3).
 * M1 implements Gemini Live only; swap implementations behind this surface later.
 */
export type LiveConnectModality = "TEXT" | "AUDIO";

export type EphemeralLiveCredentials = {
  token: string;
  model: string;
  responseModalities: LiveConnectModality[];
};
