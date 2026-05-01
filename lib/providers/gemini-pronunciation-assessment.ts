import { parseModelJsonObject } from "@/lib/diagnostics/extract-json-text";
import { getDiagnosticsGenAI, getDiagnosticsModel } from "@/lib/diagnostics/gemini-flash-client";
import { PronunciationScoresV1Schema, type PronunciationScoresV1 } from "@/lib/diagnostics/schemas";

const MAX_REFERENCE_CHARS = 8_000;

/**
 * Multimodal pronunciation assessment using Gemini Flash (works with browser `audio/webm` blobs).
 * Use when Azure short-audio WAV path is unavailable (M3-T05 fallback / default for current pipeline).
 */
export async function runGeminiPronunciationAssessment(input: {
  audioBytes: Buffer;
  mimeType: string;
  /** Concatenated learner lines — reference for what they intended to say (ADR-005: transcript-derived). */
  referenceText: string;
}): Promise<PronunciationScoresV1> {
  const ref = input.referenceText.trim().slice(0, MAX_REFERENCE_CHARS);
  if (!ref) {
    return {
      v: 1,
      provider: "gemini",
      overallScore: 0,
      dimensions: {
        accuracy: 0,
        fluency: 0,
        completeness: 0,
      },
      summary:
        "No learner transcript lines were available to align pronunciation. Record with the mic or ensure captions are on.",
    };
  }

  const ai = getDiagnosticsGenAI();
  const model = getDiagnosticsModel();
  const b64 = input.audioBytes.toString("base64");

  const systemInstruction = [
    "You are a French pronunciation coach.",
    "Listen to the learner audio and compare it to the reference text (what they meant to say).",
    "Score in HundredMark style 0–100 for accuracy, fluency, completeness; prosody optional 0–100.",
    "overallScore is a weighted summary of those dimensions (also 0–100).",
    'Return JSON only matching: {"v":1,"provider":"gemini","overallScore":number,"dimensions":{"accuracy":number,"fluency":number,"completeness":number,"prosody"?:number},"summary":string,"highlights"?:[{"phrase":string,"tip":string}]}',
  ].join(" ");

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: input.mimeType || "audio/webm",
              data: b64,
            },
          },
          {
            text: `Reference text (learner intent, French):\n\n${ref}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini returned empty pronunciation response.");
  }

  const parsed = PronunciationScoresV1Schema.safeParse(parseModelJsonObject(raw));
  if (!parsed.success) {
    throw new Error(`Pronunciation JSON failed validation: ${parsed.error.message}`);
  }
  if (parsed.data.provider !== "gemini") {
    throw new Error("Pronunciation response must declare provider gemini for this pass.");
  }
  return parsed.data;
}

/**
 * When merged session audio is missing, approximate pronunciation feedback from written French only.
 * Scores are a **proxy** (no acoustic signal); the summary must state that clearly.
 */
export async function runGeminiPronunciationTranscriptProxy(
  learnerFrenchText: string,
): Promise<PronunciationScoresV1> {
  const ref = learnerFrenchText.trim().slice(0, MAX_REFERENCE_CHARS);
  if (!ref) {
    return {
      v: 1,
      provider: "gemini",
      overallScore: 0,
      dimensions: {
        accuracy: 0,
        fluency: 0,
        completeness: 0,
      },
      summary:
        "(Transcript-only — no merged session recording.) No learner lines were saved; pronunciation was not assessed.",
    };
  }

  const ai = getDiagnosticsGenAI();
  const model = getDiagnosticsModel();

  const systemInstruction = [
    "Merged session audio is NOT available. You only see the learner's written French.",
    "Produce a transcript-only PROXY for pronunciation coaching: likely liaison/elision stress patterns,",
    "difficult clusters, and register — not true acoustic scores.",
    "Use HundredMark-style 0–100 for accuracy/fluency/completeness as *inferred* from text; keep scores conservative.",
    "overallScore summarizes those dimensions (0–100).",
    'Return JSON only: {"v":1,"provider":"gemini","overallScore":number,"dimensions":{"accuracy":number,"fluency":number,"completeness":number,"prosody"?:number},"summary":string,"highlights"?:[{"phrase":string,"tip":string}]}',
    "The summary MUST begin exactly with: (Transcript-only — no merged session recording.)",
  ].join(" ");

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: `Learner lines (French):\n\n${ref}` }],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.25,
      responseMimeType: "application/json",
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini returned empty transcript-proxy pronunciation response.");
  }

  const parsed = PronunciationScoresV1Schema.safeParse(parseModelJsonObject(raw));
  if (!parsed.success) {
    throw new Error(`Transcript-proxy pronunciation JSON failed validation: ${parsed.error.message}`);
  }
  if (parsed.data.provider !== "gemini") {
    throw new Error("Pronunciation response must declare provider gemini for this pass.");
  }
  return parsed.data;
}
