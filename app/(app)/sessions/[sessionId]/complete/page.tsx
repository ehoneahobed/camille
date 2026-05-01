import { RunDiagnosticButton } from "@/components/diagnostics/run-diagnostic-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function SessionCompletePage({
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
    where: { id: sessionId, userId: session.user.id, status: "ENDED" },
  });
  if (!practice) {
    notFound();
  }

  const turnCount = await prisma.turn.count({ where: { sessionId } });
  const durationSec =
    practice.endedAt != null
      ? Math.max(
          0,
          Math.round((practice.endedAt.getTime() - practice.startedAt.getTime()) / 1000),
        )
      : 0;

  const scenarioLabel =
    SCENARIOS.find((s) => s.id === practice.scenarioId)?.en ?? practice.scenarioId;

  const canRunDiagnostic = turnCount > 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:px-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Session complete</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">
        {scenarioLabel}
      </h1>
      <dl className="mt-10 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-rule bg-canvas-2/60 p-4">
          <dt className="text-mute">Duration</dt>
          <dd className="mt-1 font-medium text-ink">
            {Math.floor(durationSec / 60)}m {durationSec % 60}s
          </dd>
        </div>
        <div className="rounded-lg border border-rule bg-canvas-2/60 p-4">
          <dt className="text-mute">Turns saved</dt>
          <dd className="mt-1 font-medium text-ink">{turnCount}</dd>
        </div>
        <div className="col-span-2 rounded-lg border border-rule bg-canvas-2/60 p-4">
          <dt className="text-mute">Audio</dt>
          <dd className="mt-1 text-ink-2">
            {practice.audioS3Key ? (
              <code className="break-all font-mono text-[11px] text-wine-2">{practice.audioS3Key}</code>
            ) : (
              <span>
                No merged file yet (multi-chunk concat is async — see ADR-003).
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canRunDiagnostic ? (
          <RunDiagnosticButton sessionId={sessionId} />
        ) : (
          <button
            type="button"
            disabled
            className="border border-rule px-6 py-2.5 text-sm font-medium text-mute-2"
            title="At least one transcript turn is required to run a diagnostic."
          >
            Run diagnostic
          </button>
        )}
        <Link
          href={`/sessions/${sessionId}/transcript`}
          className="inline-flex justify-center border border-rule-2 px-6 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-mute hover:text-ink"
        >
          View transcript
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex justify-center bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-2"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
