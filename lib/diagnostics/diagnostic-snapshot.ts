import type { Diagnostic } from "@/app/generated/prisma/client";
import type { DiagnosticSnapshot } from "@/lib/diagnostics/types";

/** Serialize Prisma `Diagnostic` for client components (ISO dates). */
export function diagnosticToSnapshot(d: Diagnostic): DiagnosticSnapshot {
  return {
    id: d.id,
    sessionId: d.sessionId,
    status: d.status,
    pronunciationScoresJson: d.pronunciationScoresJson,
    grammarFeedbackJson: d.grammarFeedbackJson,
    vocabularyJson: d.vocabularyJson,
    aggregateScore: d.aggregateScore,
    runAt: d.runAt?.toISOString() ?? null,
    error: d.error,
  };
}
