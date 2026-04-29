import { GoogleGenAI, Modality } from "@google/genai/node";
import { getGeminiApiKey, getLiveModelId } from "@/lib/config/live";
import { buildLiveSystemInstruction } from "@/lib/prompts/live-system";

export type MintLiveTokenInput = {
  scenarioId: string;
  startingCefr: string;
  voiceId?: string | null;
};

export type MintLiveTokenResult = {
  /** Ephemeral token value passed to the browser as `apiKey`. */
  token: string;
  model: string;
  /** Modalities locked into the token — client must match when calling `live.connect`. */
  responseModalities: Modality[];
};

function parseModalities(): Modality[] {
  const raw = process.env.GEMINI_LIVE_RESPONSE_MODALITIES ?? "TEXT";
  const parts = raw.split(",").map((s) => s.trim().toUpperCase());
  const out: Modality[] = [];
  for (const p of parts) {
    if (p === "AUDIO") out.push(Modality.AUDIO);
    else if (p === "TEXT") out.push(Modality.TEXT);
  }
  return out.length ? out : [Modality.TEXT];
}

/**
 * Mints a short-lived Live API token (server-side only; never send the primary API key to the client).
 */
export async function mintGeminiLiveEphemeralToken(
  input: MintLiveTokenInput,
): Promise<MintLiveTokenResult> {
  const model = getLiveModelId();
  const apiKey = getGeminiApiKey();
  const responseModalities = parseModalities();

  const client = new GoogleGenAI({
    apiKey,
    apiVersion: "v1alpha",
  });

  const systemInstruction = buildLiveSystemInstruction({
    scenarioId: input.scenarioId,
    startingCefr: input.startingCefr,
    voiceId: input.voiceId,
  });

  const token = await client.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model,
        config: {
          responseModalities,
          systemInstruction,
        },
      },
    },
  });

  if (!token.name) {
    throw new Error("Gemini auth token response missing `name`.");
  }

  return { token: token.name, model, responseModalities };
}
