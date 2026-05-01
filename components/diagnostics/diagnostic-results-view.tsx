"use client";

import {
  AggregateScoreCard,
  GrammarReportView,
  PronunciationReportView,
  VocabularyReportView,
} from "@/components/diagnostics/diagnostic-report-views";
import type { DiagnosticSnapshot } from "@/lib/diagnostics/types";
import {
  parseGrammarReport,
  parsePronunciationReport,
  parseVocabularyReport,
} from "@/lib/diagnostics/parse-report-json";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type SessionApiPayload = {
  id: string;
  status: string;
  diagnostic: DiagnosticSnapshot | null;
};

type TabId = "pronunciation" | "grammar" | "vocabulary";

function isTerminal(status: string | undefined) {
  return status === "DONE" || status === "FAILED";
}

type DiagnosticResultsViewProps = {
  sessionId: string;
  initial: DiagnosticSnapshot | null;
};

/**
 * Polls `GET /api/sessions/[id]` while diagnostic is `QUEUED` or `RUNNING`; renders tabbed reports when `DONE`.
 */
export function DiagnosticResultsView({ sessionId, initial }: DiagnosticResultsViewProps) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticSnapshot | null>(initial);
  const [tab, setTab] = useState<TabId>("pronunciation");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) return;
    const data = (await res.json()) as SessionApiPayload;
    setDiagnostic(data.diagnostic ?? null);
  }, [sessionId]);

  useEffect(() => {
    const status = diagnostic?.status;
    if (!status || isTerminal(status)) return;
    if (status !== "QUEUED" && status !== "RUNNING") return;
    const id = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [diagnostic?.status, refresh]);

  const status = diagnostic?.status ?? "NOT_RUN";

  const pronunciationParsed = useMemo(
    () => parsePronunciationReport(diagnostic?.pronunciationScoresJson),
    [diagnostic?.pronunciationScoresJson],
  );
  const grammarParsed = useMemo(
    () => parseGrammarReport(diagnostic?.grammarFeedbackJson),
    [diagnostic?.grammarFeedbackJson],
  );
  const vocabularyParsed = useMemo(
    () => parseVocabularyReport(diagnostic?.vocabularyJson),
    [diagnostic?.vocabularyJson],
  );

  if (status === "QUEUED" || status === "RUNNING") {
    return (
      <div className="rounded-lg border border-rule bg-canvas-2/60 p-6 text-sm text-ink-2">
        <p className="font-medium text-ink">Diagnostic {status === "QUEUED" ? "queued" : "running"}…</p>
        <p className="mt-2 text-mute">This page updates automatically. You can leave and come back.</p>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="rounded-lg border border-wine/40 bg-canvas-2/60 p-6 text-sm">
        <p className="font-medium text-wine">Diagnostic failed</p>
        <p className="mt-2 text-ink-2">{diagnostic?.error ?? "Unknown error"}</p>
        <p className="mt-4 text-mute">
          Try again from the session summary or transcript when the issue is resolved.
        </p>
      </div>
    );
  }

  if (status !== "DONE") {
    return (
      <div className="rounded-lg border border-rule bg-canvas-2/60 p-6 text-sm text-ink-2">
        <p>No diagnostic results yet.</p>
        <p className="mt-2 text-mute">Run a diagnostic from the session summary or transcript.</p>
      </div>
    );
  }

  const score = diagnostic?.aggregateScore;

  const tabs = [
    ["pronunciation", "Pronunciation"],
    ["grammar", "Grammar"],
    ["vocabulary", "Vocabulary"],
  ] as const;

  return (
    <div className="space-y-8">
      {typeof score === "number" ? <AggregateScoreCard score={score} /> : null}

      <div role="tablist" aria-label="Diagnostic sections" className="flex flex-wrap gap-2 border-b border-rule pb-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            id={`diag-tab-${id}`}
            aria-controls={`diag-panel-${id}`}
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? "bg-ink text-canvas" : "text-mute hover:bg-canvas-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="diag-panel-pronunciation"
        aria-labelledby="diag-tab-pronunciation"
        hidden={tab !== "pronunciation"}
        className="min-h-[200px]"
      >
        <PronunciationReportView parsed={pronunciationParsed} />
      </div>
      <div
        role="tabpanel"
        id="diag-panel-grammar"
        aria-labelledby="diag-tab-grammar"
        hidden={tab !== "grammar"}
        className="min-h-[200px]"
      >
        <GrammarReportView parsed={grammarParsed} />
      </div>
      <div
        role="tabpanel"
        id="diag-panel-vocabulary"
        aria-labelledby="diag-tab-vocabulary"
        hidden={tab !== "vocabulary"}
        className="min-h-[200px]"
      >
        <VocabularyReportView parsed={vocabularyParsed} />
      </div>

      <Link
        href={`/sessions/${sessionId}/transcript`}
        className="inline-block text-sm text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        ← Transcript
      </Link>
    </div>
  );
}
