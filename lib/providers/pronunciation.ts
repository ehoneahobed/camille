import { runAzureShortAudioPronunciationAssessment, isWavContainer } from "@/lib/providers/azure-speech-pronunciation";
import { runGeminiPronunciationAssessment } from "@/lib/providers/gemini-pronunciation-assessment";
import { getAzureSpeechCredentials } from "@/lib/config/diagnostics";
import type { PronunciationScoresV1 } from "@/lib/diagnostics/schemas";

export type SessionPronunciationInput = {
  audioBytes: Buffer;
  mimeType: string;
  /** Concatenated USER turn text — reference for assessment (see ADR-005 in implementation plan). */
  referenceText: string;
};

/**
 * M3-T05 facade: Azure REST when WAV + credentials are available; otherwise Gemini multimodal on WebM/Opus.
 */
export async function runSessionPronunciationAssessment(input: SessionPronunciationInput): Promise<PronunciationScoresV1> {
  const mime = input.mimeType.toLowerCase();
  const useAzure =
    Boolean(getAzureSpeechCredentials()) &&
    isWavContainer(input.audioBytes) &&
    (mime.includes("wav") || mime.includes("audio/wav"));

  if (useAzure) {
    try {
      return await runAzureShortAudioPronunciationAssessment({
        wavPcm16kMono: input.audioBytes,
        referenceText: input.referenceText.trim() || " ",
        locale: "fr-FR",
      });
    } catch (err) {
      console.warn("[diagnostic] Azure pronunciation failed; falling back to Gemini.", err);
    }
  }

  return runGeminiPronunciationAssessment({
    audioBytes: input.audioBytes,
    mimeType: input.mimeType || "audio/webm",
    referenceText: input.referenceText,
  });
}
