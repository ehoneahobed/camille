import { RunDiagnosticButton } from "@/components/diagnostics/run-diagnostic-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function SessionTranscriptPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const practice = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: {
      turns: { orderBy: { index: "asc" }, take: 2000 },
      diagnostic: true,
      _count: { select: { turns: true } },
    },
  });
  if (!practice) {
    notFound();
  }

  const scenarioLabel =
    SCENARIOS.find((s) => s.id === practice.scenarioId)?.en ?? practice.scenarioId;

  const ended = practice.status === "ENDED";
  /** Merged audio improves pronunciation; grammar/vocab still run from the transcript alone. */
  const canDiagnose = ended && practice._count.turns > 0;
  const diag = practice.diagnostic;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Transcript</p>
          <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">{scenarioLabel}</h1>
        </div>
        {ended ? (
          <Link
            href={`/sessions/${sessionId}/complete`}
            className="text-sm text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            ← Summary
          </Link>
        ) : (
          <Link
            href={`/live/${sessionId}`}
            className="text-sm text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            ← Back to live
          </Link>
        )}
      </div>

      {ended ? (
        <div className="mt-8 flex flex-col gap-4 rounded-lg border border-rule bg-canvas-2/40 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="text-sm text-ink-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Diagnostic</span>
            <p className="mt-1 text-ink">
              {diag?.status === "DONE"
                ? "Results ready."
                : diag?.status === "RUNNING" || diag?.status === "QUEUED"
                  ? "In progress — open the diagnostic page to watch status."
                  : diag?.status === "FAILED"
                    ? "Last run failed — you can try again."
                    : "Not run yet."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canDiagnose &&
            diag?.status !== "DONE" &&
            diag?.status !== "QUEUED" &&
            diag?.status !== "RUNNING" ? (
              <RunDiagnosticButton
                sessionId={sessionId}
                className="inline-flex justify-center border border-rule-2 bg-canvas px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-mute"
              />
            ) : null}
            {diag?.status === "DONE" || diag?.status === "FAILED" || diag?.status === "QUEUED" || diag?.status === "RUNNING" ? (
              <Link
                href={`/sessions/${sessionId}/diagnostic`}
                className="inline-flex justify-center bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-2"
              >
                {diag.status === "DONE" ? "Open diagnostic" : "View diagnostic"}
              </Link>
            ) : null}
            {!canDiagnose ? (
              <span className="self-center text-xs text-mute" title="End the session and save at least one turn">
                Diagnostic unavailable
              </span>
            ) : null}
            {canDiagnose && !practice.audioS3Key ? (
              <span
                className="self-center text-xs text-mute"
                title="Pronunciation uses a text-only proxy until session audio is merged"
              >
                No merged recording — transcript-only diagnostic
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <ol className="mt-10 space-y-4">
        {practice.turns.map((t) => (
          <li
            key={t.id}
            className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
              t.role === "USER"
                ? "border-rule-2 bg-canvas-2/50 text-ink-2"
                : "border-rule bg-canvas-3/80 text-ink"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              {t.role === "USER" ? "You" : "Camille"} · #{t.index}
            </span>
            <p className="mt-1 whitespace-pre-wrap">{t.text}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
