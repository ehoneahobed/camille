import {
  GrammarFeedbackV1Schema,
  PronunciationScoresV1Schema,
  VocabularyV1Schema,
} from "@/lib/diagnostics/schemas";
import type { GrammarFeedbackV1, PronunciationScoresV1, VocabularyV1 } from "@/lib/diagnostics/schemas";

export type ParsedReport<T> =
  | { ok: true; data: T }
  | { ok: false; legacyStub: boolean; raw: unknown };

function isLegacyPlaceholder(raw: unknown): boolean {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "placeholder" in raw &&
    (raw as { placeholder?: boolean }).placeholder === true
  );
}

/** If the model stored only a highlights array, recover a minimal v1 shape for display. */
function coercePronunciationHighlightsOnly(raw: unknown): PronunciationScoresV1 | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }
  const first = raw[0];
  if (!first || typeof first !== "object" || !("phrase" in first) || !("tip" in first)) {
    return null;
  }
  const highlights = raw.filter(
    (x): x is { phrase: string; tip: string } =>
      Boolean(x) &&
      typeof x === "object" &&
      typeof (x as { phrase?: unknown }).phrase === "string" &&
      typeof (x as { tip?: unknown }).tip === "string",
  );
  if (highlights.length === 0) {
    return null;
  }
  return {
    v: 1,
    provider: "gemini",
    overallScore: 0,
    dimensions: { accuracy: 0, fluency: 0, completeness: 0 },
    summary:
      "This report was saved in a compact format. Overall scores were not stored; coaching tips are shown below.",
    highlights,
  };
}

export function parsePronunciationReport(raw: unknown): ParsedReport<PronunciationScoresV1> {
  if (raw === null || raw === undefined) {
    return { ok: false, legacyStub: false, raw };
  }
  if (isLegacyPlaceholder(raw)) {
    return { ok: false, legacyStub: true, raw };
  }
  const direct = PronunciationScoresV1Schema.safeParse(raw);
  if (direct.success) {
    return { ok: true, data: direct.data };
  }
  const coerced = coercePronunciationHighlightsOnly(raw);
  if (coerced) {
    return { ok: true, data: coerced };
  }
  return { ok: false, legacyStub: false, raw };
}

export function parseGrammarReport(raw: unknown): ParsedReport<GrammarFeedbackV1> {
  if (raw === null || raw === undefined) {
    return { ok: false, legacyStub: false, raw };
  }
  if (isLegacyPlaceholder(raw)) {
    return { ok: false, legacyStub: true, raw };
  }
  const parsed = GrammarFeedbackV1Schema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, legacyStub: false, raw };
}

export function parseVocabularyReport(raw: unknown): ParsedReport<VocabularyV1> {
  if (raw === null || raw === undefined) {
    return { ok: false, legacyStub: false, raw };
  }
  if (isLegacyPlaceholder(raw)) {
    return { ok: false, legacyStub: true, raw };
  }
  const parsed = VocabularyV1Schema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, legacyStub: false, raw };
}
