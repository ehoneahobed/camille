"use client";

import type { DiagnosticSnapshot } from "@/lib/diagnostics/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SessionApiPayload = {
  id: string;
  status: string;
  diagnostic: DiagnosticSnapshot | null;
};

type TabId = "pronunciation" | "grammar" | "vocabulary";

function isTerminal(status: string | undefined) {
  return status === "DONE" || status === "FAILED";
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[480px] overflow-auto rounded-lg border border-rule bg-canvas-2/80 p-4 font-mono text-[12px] leading-relaxed text-ink-2">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

type DiagnosticResultsViewProps = {
  sessionId: string;
  initial: DiagnosticSnapshot | null;
};

/**
 * Polls `GET /api/sessions/[id]` while diagnostic is `QUEUED` or `RUNNING`; renders tabbed JSON when `DONE`.
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

  const pronunciation = diagnostic?.pronunciationScoresJson ?? null;
  const grammar = diagnostic?.grammarFeedbackJson ?? null;
  const vocabulary = diagnostic?.vocabularyJson ?? null;
  const score = diagnostic?.aggregateScore;

  return (
    <div className="space-y-6">
      {typeof score === "number" ? (
        <p className="text-sm text-ink-2">
          Aggregate score (placeholder until M3-T09):{" "}
          <span className="font-medium text-ink">{score}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-rule pb-2">
        {(
          [
            ["pronunciation", "Pronunciation"],
            ["grammar", "Grammar"],
            ["vocabulary", "Vocabulary"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? "bg-ink text-canvas" : "text-mute hover:bg-canvas-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pronunciation" ? <JsonBlock value={pronunciation} /> : null}
      {tab === "grammar" ? <JsonBlock value={grammar} /> : null}
      {tab === "vocabulary" ? <JsonBlock value={vocabulary} /> : null}

      <Link
        href={`/sessions/${sessionId}/transcript`}
        className="inline-block text-sm text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        ← Transcript
      </Link>
    </div>
  );
}
