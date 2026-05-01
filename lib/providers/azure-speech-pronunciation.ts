import { getAzureSpeechCredentials } from "@/lib/config/diagnostics";
import type { PronunciationScoresV1 } from "@/lib/diagnostics/schemas";

type AzureSttNBest = {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  ProsodyScore?: number;
};

type AzureSttJson = {
  RecognitionStatus?: string;
  NBest?: Array<AzureSttNBest & Record<string, unknown>>;
};

/**
 * True when buffer looks like a WAV container (Azure short-audio pronunciation REST expects PCM WAV).
 */
export function isWavContainer(buffer: Buffer): boolean {
  if (buffer.length < 12) {
    return false;
  }
  return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WAVE";
}

/**
 * Azure Speech short-audio REST with `Pronunciation-Assessment` header (≤ ~30s audio, PCM 16 kHz mono WAV).
 *
 * Session audio from the browser is usually **WebM**; this path runs only when merged audio is WAV
 * (e.g. future concat/remux pipeline) and `AZURE_SPEECH_*` env vars are set.
 *
 * @see https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short
 */
export async function runAzureShortAudioPronunciationAssessment(input: {
  wavPcm16kMono: Buffer;
  referenceText: string;
  /** BCP-47, e.g. fr-FR */
  locale: string;
}): Promise<PronunciationScoresV1> {
  const creds = getAzureSpeechCredentials();
  if (!creds) {
    throw new Error("Azure Speech credentials missing (AZURE_SPEECH_KEY + AZURE_SPEECH_REGION).");
  }

  const pronParams = Buffer.from(
    JSON.stringify({
      ReferenceText: input.referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
    }),
    "utf8",
  ).toString("base64");

  const url = `https://${creds.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(input.locale)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": creds.subscriptionKey,
      "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
      "Pronunciation-Assessment": pronParams,
      Accept: "application/json",
    },
    body: new Uint8Array(input.wavPcm16kMono),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Azure Speech HTTP ${res.status}: ${text.slice(0, 400)}`);
  }

  let body: AzureSttJson;
  try {
    body = JSON.parse(text) as AzureSttJson;
  } catch {
    throw new Error("Azure Speech returned non-JSON body.");
  }

  if (body.RecognitionStatus && body.RecognitionStatus !== "Success") {
    throw new Error(`Azure Speech recognition status: ${body.RecognitionStatus}`);
  }

  const best = body.NBest?.[0];
  if (!best) {
    throw new Error("Azure Speech response missing NBest[0].");
  }

  const accuracy = Number(best.AccuracyScore ?? 0);
  const fluency = Number(best.FluencyScore ?? 0);
  const completeness = Number(best.CompletenessScore ?? 0);
  const prosody = typeof best.ProsodyScore === "number" ? best.ProsodyScore : undefined;
  const pronScore = Number(best.PronScore ?? Math.round((accuracy + fluency + completeness) / 3));

  return {
    v: 1,
    provider: "azure",
    overallScore: Math.max(0, Math.min(100, Math.round(pronScore))),
    dimensions: {
      accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
      fluency: Math.max(0, Math.min(100, Math.round(fluency))),
      completeness: Math.max(0, Math.min(100, Math.round(completeness))),
      ...(prosody !== undefined ? { prosody: Math.max(0, Math.min(100, Math.round(prosody))) } : {}),
    },
    summary: "Scores from Azure Speech pronunciation assessment (short-audio REST).",
  };
}
