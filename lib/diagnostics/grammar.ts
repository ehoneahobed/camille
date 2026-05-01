import { parseModelJsonObject } from "@/lib/diagnostics/extract-json-text";
import { getDiagnosticsGenAI, getDiagnosticsModel } from "@/lib/diagnostics/gemini-flash-client";
import {
  GrammarVocabularyBundleSchema,
  type GrammarFeedbackV1,
  type VocabularyV1,
} from "@/lib/diagnostics/schemas";

const MAX_TRANSCRIPT_CHARS = 48_000;

/**
 * Runs a single Gemini Flash pass over the session transcript for grammar + vocabulary (M3-T07–T08).
 *
 * @param fullTranscript — Chronological USER + ASSISTANT lines (plain text).
 * @param learnerCefr — Starting CEFR from `UserSettings` (e.g. B1) to tune strictness.
 */
export async function runGrammarAndVocabularyPass(input: {
  fullTranscript: string;
  learnerCefr: string;
}): Promise<{ grammar: GrammarFeedbackV1; vocabulary: VocabularyV1 }> {
  const transcript = input.fullTranscript.slice(0, MAX_TRANSCRIPT_CHARS);
  const ai = getDiagnosticsGenAI();
  const model = getDiagnosticsModel();

  const systemInstruction = [
    "You are Camille's offline French coach.",
    `Learner CEFR (starting level): ${input.learnerCefr}.`,
    "USER lines come from **automatic speech-to-text** during the live call. They often do **not** match what the learner actually said.",
    "Use ASSISTANT (Camille) replies and dialogue flow to infer what was probably meant. When a USER line looks like mistranscription",
    "(wrong language, nonsense words, or text that Camille's reply does not fit), prefer a brief note or skip a harsh grammar flag rather than drilling the learner for ASR garbage.",
    "Analyze French grammar issues in LEARNER (USER) lines only when the text is plausibly what they tried to say in context.",
    "For vocabulary: list French words/phrases the learner likely used confidently vs ones that look hesitant, misused, or that Camille corrected —",
    "again, discount obvious ASR artifacts.",
    "Reply with JSON only (no markdown) matching this shape:",
    '{"grammar":{"v":1,"summary":string,"overallScore":0-100,"items":[{"quote":string,"issue":string,"correction":string,"severity":"low"|"medium"|"high"}]},',
    '"vocabulary":{"v":1,"comfortable":string[],"stumbled":string[],"notes"?:string}}',
    "If there are no USER lines, grammar.items must be [] and grammar.overallScore 100; vocabulary arrays may be empty.",
  ].join(" ");

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: `Transcript:\n\n${transcript}` }],
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
    throw new Error("Gemini returned empty grammar/vocabulary response.");
  }

  const parsed = GrammarVocabularyBundleSchema.safeParse(parseModelJsonObject(raw));
  if (!parsed.success) {
    throw new Error(`Grammar/vocabulary JSON failed validation: ${parsed.error.message}`);
  }

  return { grammar: parsed.data.grammar, vocabulary: parsed.data.vocabulary };
}
