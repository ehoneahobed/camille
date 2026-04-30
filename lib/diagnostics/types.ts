/** Matches `GET /api/sessions/[id]` → `diagnostic` after JSON serialization. */
export type DiagnosticSnapshot = {
  id: string;
  sessionId: string;
  status: "NOT_RUN" | "QUEUED" | "RUNNING" | "DONE" | "FAILED";
  pronunciationScoresJson: unknown;
  grammarFeedbackJson: unknown;
  vocabularyJson: unknown;
  aggregateScore: number | null;
  runAt: string | null;
  error: string | null;
};
