import type { GrammarFeedbackV1, PronunciationScoresV1, VocabularyV1 } from "@/lib/diagnostics/schemas";

/**
 * M3-T09: single 0–100 roll-up for dashboard / history.
 *
 * Weights: pronunciation 45%, grammar 35%, vocabulary exposure 20%.
 * Vocabulary term uses the share of "comfortable" lemmas vs (comfortable + stumbled).
 */
export function computeAggregateDiagnosticScore(input: {
  pronunciation: PronunciationScoresV1;
  grammar: GrammarFeedbackV1;
  vocabulary: VocabularyV1;
}): number {
  const P = clamp100(input.pronunciation.overallScore);
  const G = clamp100(input.grammar.overallScore);
  const denom = input.vocabulary.comfortable.length + input.vocabulary.stumbled.length;
  const V = denom === 0 ? G : clamp100((input.vocabulary.comfortable.length / denom) * 100);
  return Math.round(0.45 * P + 0.35 * G + 0.2 * V);
}

function clamp100(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(n)));
}
