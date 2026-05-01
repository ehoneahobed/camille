"use client";

import type { GrammarFeedbackV1, PronunciationScoresV1, VocabularyV1 } from "@/lib/diagnostics/schemas";
import type { ParsedReport } from "@/lib/diagnostics/parse-report-json";
import { useState } from "react";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-mute">{label}</span>
        <span className="font-mono tabular-nums text-ink-2">{clamped}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-wine-2/90 to-wine/80"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${clamped} out of 100`}
        />
      </div>
    </div>
  );
}

function ReportFallback({
  title,
  legacyStub,
  raw,
}: {
  title: string;
  legacyStub: boolean;
  raw: unknown;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-rule-2 bg-canvas-2/50 p-5 text-sm">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-2 leading-relaxed text-ink-2">
        {legacyStub
          ? "This diagnostic used an older preview stub. Run the diagnostic again to generate a full report."
          : "This section could not be read in the expected format. You can still inspect the raw payload below."}
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-4 text-xs font-medium text-mute underline-offset-4 hover:text-ink hover:underline"
      >
        {open ? "Hide technical details" : "Show technical details"}
      </button>
      {open ? (
        <pre className="mt-3 max-h-[320px] overflow-auto rounded-md border border-rule bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-2">
          {JSON.stringify(raw, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function ProviderPill({ provider }: { provider: "gemini" | "azure" }) {
  return (
    <span className="inline-flex items-center rounded-full border border-rule-2 bg-canvas-3/80 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mute">
      {provider === "azure" ? "Azure Speech" : "Gemini"}
    </span>
  );
}

export function AggregateScoreCard({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="rounded-xl border border-rule bg-gradient-to-br from-canvas-2/90 to-canvas-3/60 p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Session overview</p>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <div>
          <p className="font-display text-5xl leading-none tracking-tight text-ink">{clamped}</p>
          <p className="mt-2 text-sm text-ink-2">Combined score (out of 100)</p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-mute">
          Blend of pronunciation, grammar, and vocabulary. Open each tab for concrete feedback you can act on.
        </p>
      </div>
    </div>
  );
}

export function PronunciationReportView({ parsed }: { parsed: ParsedReport<PronunciationScoresV1> }) {
  if (!parsed.ok) {
    return (
      <ReportFallback
        title="Pronunciation"
        legacyStub={parsed.legacyStub}
        raw={parsed.raw}
      />
    );
  }
  const d = parsed.data;
  const transcriptOnly = d.summary.includes("(Transcript-only");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <ProviderPill provider={d.provider} />
        {transcriptOnly ? (
          <span className="rounded-full border border-wine/30 bg-wine-soft/40 px-2.5 py-0.5 text-[11px] text-ink-2">
            No session recording — text-based estimate
          </span>
        ) : null}
      </div>

      <div className="grid gap-8 sm:grid-cols-[minmax(0,200px)_1fr] sm:items-start">
        <div className="rounded-xl border border-rule bg-canvas-2/60 p-5 text-center sm:text-left">
          <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Overall</p>
          <p className="mt-2 font-display text-4xl text-ink">{Math.round(d.overallScore)}</p>
          <p className="mt-1 text-xs text-mute">out of 100</p>
        </div>
        <div className="space-y-4">
          <ScoreBar label="Accuracy" value={d.dimensions.accuracy} />
          <ScoreBar label="Fluency" value={d.dimensions.fluency} />
          <ScoreBar label="Completeness" value={d.dimensions.completeness} />
          {d.dimensions.prosody !== undefined ? (
            <ScoreBar label="Prosody" value={d.dimensions.prosody} />
          ) : null}
        </div>
      </div>

      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Coach summary</h3>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">{d.summary}</p>
      </section>

      {d.highlights && d.highlights.length > 0 ? (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Focus phrases</h3>
          <ul className="mt-4 space-y-3">
            {d.highlights.map((h, i) => (
              <li
                key={`${h.phrase}-${i}`}
                className="rounded-lg border border-rule-2 bg-canvas-3/50 px-4 py-3"
              >
                <p className="font-medium text-ink">&ldquo;{h.phrase}&rdquo;</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{h.tip}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

const severityOrder = { high: 0, medium: 1, low: 2 } as const;

function severityStyles(sev: "low" | "medium" | "high") {
  switch (sev) {
    case "high":
      return "border-wine/40 bg-wine-soft/35 text-wine-2";
    case "medium":
      return "border-rule-2 bg-canvas-3/80 text-ink-2";
    default:
      return "border-rule bg-canvas-2/60 text-mute";
  }
}

export function GrammarReportView({ parsed }: { parsed: ParsedReport<GrammarFeedbackV1> }) {
  if (!parsed.ok) {
    return (
      <ReportFallback
        title="Grammar"
        legacyStub={parsed.legacyStub}
        raw={parsed.raw}
      />
    );
  }
  const d = parsed.data;
  const items = [...d.items].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-mute">Grammar quality</p>
          <p className="mt-2 font-display text-4xl text-ink">{Math.round(d.overallScore)}</p>
          <p className="mt-1 text-xs text-mute">out of 100</p>
        </div>
      </div>
      <ScoreBar label="Overall" value={d.overallScore} />

      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Summary</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{d.summary}</p>
      </section>

      {items.length > 0 ? (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
            Corrections ({items.length})
          </h3>
          <ul className="mt-4 space-y-4">
            {items.map((it, i) => (
              <li
                key={`grammar-${i}`}
                className={`rounded-lg border px-4 py-4 ${severityStyles(it.severity)}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mute">
                    {it.severity}
                  </span>
                </div>
                <blockquote className="mt-3 border-l-2 border-rule-2 pl-3 text-sm italic text-ink">
                  {it.quote}
                </blockquote>
                <p className="mt-3 text-sm text-ink-2">
                  <span className="text-mute">Issue: </span>
                  {it.issue}
                </p>
                <p className="mt-2 text-sm text-ink">
                  <span className="text-mute">Try: </span>
                  {it.correction}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-mute">No grammar issues flagged for this session.</p>
      )}
    </div>
  );
}

function WordChips({ title, words, variant }: { title: string; words: string[]; variant: "good" | "watch" }) {
  if (words.length === 0) {
    return null;
  }
  const chip =
    variant === "good"
      ? "border-rule-2 bg-canvas-3/90 text-ink"
      : "border-wine/35 bg-wine-soft/40 text-ink-2";
  return (
    <section>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">{title}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {words.map((w, i) => (
          <li
            key={`${w}-${i}`}
            className={`rounded-full border px-3 py-1 text-sm ${chip}`}
          >
            {w}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VocabularyReportView({ parsed }: { parsed: ParsedReport<VocabularyV1> }) {
  if (!parsed.ok) {
    return (
      <ReportFallback
        title="Vocabulary"
        legacyStub={parsed.legacyStub}
        raw={parsed.raw}
      />
    );
  }
  const d = parsed.data;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <WordChips title="Comfortable" words={d.comfortable} variant="good" />
        <WordChips title="Work on next" words={d.stumbled} variant="watch" />
      </div>
      {!d.comfortable.length && !d.stumbled.length ? (
        <p className="text-sm text-mute">No vocabulary tags for this session.</p>
      ) : null}
      {d.notes ? (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Notes</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{d.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
