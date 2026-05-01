import { z } from "zod";

/** Stored in `Diagnostic.pronunciationScoresJson`. */
export const PronunciationScoresV1Schema = z.object({
  v: z.literal(1),
  provider: z.enum(["gemini", "azure"]),
  overallScore: z.number().min(0).max(100),
  dimensions: z.object({
    accuracy: z.number().min(0).max(100),
    fluency: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    prosody: z.number().min(0).max(100).optional(),
  }),
  summary: z.string(),
  /** Short coaching bullets derived from the assessment. */
  highlights: z
    .array(
      z.object({
        phrase: z.string(),
        tip: z.string(),
      }),
    )
    .optional(),
});

export type PronunciationScoresV1 = z.infer<typeof PronunciationScoresV1Schema>;

export const GrammarFeedbackItemSchema = z.object({
  quote: z.string(),
  issue: z.string(),
  correction: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

export const GrammarFeedbackV1Schema = z.object({
  v: z.literal(1),
  summary: z.string(),
  overallScore: z.number().min(0).max(100),
  items: z.array(GrammarFeedbackItemSchema),
});

export type GrammarFeedbackV1 = z.infer<typeof GrammarFeedbackV1Schema>;

export const VocabularyV1Schema = z.object({
  v: z.literal(1),
  comfortable: z.array(z.string()),
  stumbled: z.array(z.string()),
  notes: z.string().optional(),
});

export type VocabularyV1 = z.infer<typeof VocabularyV1Schema>;

/** Single Gemini JSON payload for grammar + vocabulary passes (M3-T07–T08). */
export const GrammarVocabularyBundleSchema = z.object({
  grammar: GrammarFeedbackV1Schema,
  vocabulary: VocabularyV1Schema,
});

export type GrammarVocabularyBundle = z.infer<typeof GrammarVocabularyBundleSchema>;
