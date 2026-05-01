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
  /**
   * Automatic captions / persisted USER lines (same pipeline as live transcription).
   * Often wrong — prompts tell the model to trust **audio** over this text when they conflict.
   */
  referenceText: string;
}): Promise<PronunciationScoresV1> {
  const ref = input.referenceText.trim().slice(0, MAX_REFERENCE_CHARS);
  const ai = getDiagnosticsGenAI();
  const model = getDiagnosticsModel();
  const b64 = input.audioBytes.toString("base64");

  const jsonShape =
    '{"v":1,"provider":"gemini","overallScore":number,"dimensions":{"accuracy":number,"fluency":number,"completeness":number,"prosody"?:number},"summary":string,"highlights"?:[{"phrase":string,"tip":string}]}';

  /** Audio is the source of truth; captions are hints only (ASR errors are common). */
  const systemWithCaptions = [
    "You are a French pronunciation coach.",
    "You receive learner speech audio plus OPTIONAL automatic captions (from the same live ASR that saved the transcript).",
    "Those captions are often wrong: homophones, missing words, wrong language fragments, or garbled phrases.",
    "PRIMARY EVIDENCE is what you **hear** in the audio. When captions and audio disagree, trust the audio for all scores and feedback.",
    "Do NOT penalize the learner because the caption text does not match what they clearly said.",
    "Use captions only as a loose guide for which moments to comment on when they roughly align.",
    "Score HundredMark 0–100 for accuracy, fluency, completeness (spoken intelligibility and naturalness — not 'match to caption'). Prosody optional 0–100.",
    "overallScore summarizes those dimensions (0–100).",
    "If the summary mentions captions, briefly note that on-device/live transcription can mis-hear.",
    `Return JSON only matching: ${jsonShape}`,
  ].join(" ");

  const systemAudioOnly = [
    "You are a French pronunciation coach.",
    "Assess spoken French from the learner audio alone (no reference script).",
    "Score HundredMark 0–100 for accuracy, fluency, completeness of what you hear; prosody optional 0–100.",
    "overallScore summarizes those dimensions (0–100).",
    `Return JSON only matching: ${jsonShape}`,
  ].join(" ");

  const userParts = ref
    ? [
        {
          inlineData: {
            mimeType: input.mimeType || "audio/webm",
            data: b64,
          },
        },
        {
          text: [
            "Automatic captions (may NOT match the audio — treat as unreliable ASR):",
            "",
            ref,
          ].join("\n"),
        },
      ]
    : [
        {
          inlineData: {
            mimeType: input.mimeType || "audio/webm",
            data: b64,
          },
        },
        {
          text: "No learner captions were saved for this session; judge pronunciation from the audio alone.",
        },
      ];

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: userParts,
      },
    ],
    config: {
      systemInstruction: ref ? systemWithCaptions : systemAudioOnly,
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
    "Merged session audio is NOT available. You only see the learner's lines as **automatic captions** (ASR),",
    "which often mis-hear or mis-spell what was intended. Do not treat the text as ground truth.",
    "Produce a transcript-only PROXY: likely liaison/elision stress patterns, difficult clusters, register — not true acoustic scores.",
    "When text looks inconsistent or un-French, it may be mistranscription — note that instead of harsh criticism.",
    "Use HundredMark-style 0–100 for accuracy/fluency/completeness as *weakly inferred* from text; keep scores conservative.",
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
