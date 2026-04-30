import { RunDiagnosticButton } from "@/components/diagnostics/run-diagnostic-button";
import { DiagnosticResultsView } from "@/components/diagnostics/diagnostic-results-view";
import { diagnosticToSnapshot } from "@/lib/diagnostics/diagnostic-snapshot";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function SessionDiagnosticPage({
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
      diagnostic: true,
      _count: { select: { turns: true } },
    },
  });
  if (!practice) {
    notFound();
  }
  if (practice.status !== "ENDED") {
    redirect(`/live/${sessionId}`);
  }

  const scenarioLabel =
    SCENARIOS.find((s) => s.id === practice.scenarioId)?.en ?? practice.scenarioId;

  const turnCount = practice._count.turns;
  const canDiagnose = Boolean(practice.audioS3Key) && turnCount > 0;
  const ds = practice.diagnostic?.status;
  const showRunDiagnostic =
    canDiagnose &&
    (ds == null || ds === "NOT_RUN" || ds === "FAILED");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Diagnostic</p>
          <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">{scenarioLabel}</h1>
        </div>
        <Link
          href={`/sessions/${sessionId}/complete`}
          className="text-sm text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          ← Summary
        </Link>
      </div>

      {!canDiagnose ? (
        <p className="mt-8 text-sm text-ink-2">
          Diagnostics need merged audio and at least one transcript turn.{" "}
          {!practice.audioS3Key ? "Audio is not finalized yet." : "Save turns during the session."}
        </p>
      ) : showRunDiagnostic ? (
        <div className="mt-8">
          <RunDiagnosticButton sessionId={sessionId} />
        </div>
      ) : null}

      <div className="mt-10">
        <DiagnosticResultsView
          sessionId={sessionId}
          initial={practice.diagnostic ? diagnosticToSnapshot(practice.diagnostic) : null}
        />
      </div>
    </main>
  );
}
