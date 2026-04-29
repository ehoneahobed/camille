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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Session complete
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
        {scenarioLabel}
      </h1>
      <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-zinc-500">Duration</dt>
          <dd className="mt-1 font-medium text-zinc-100">
            {Math.floor(durationSec / 60)}m {durationSec % 60}s
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-zinc-500">Turns saved</dt>
          <dd className="mt-1 font-medium text-zinc-100">{turnCount}</dd>
        </div>
        <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <dt className="text-zinc-500">Audio (S3)</dt>
          <dd className="mt-1 text-zinc-200">
            {practice.audioS3Key ? (
              <code className="text-xs break-all text-orange-200/90">{practice.audioS3Key}</code>
            ) : (
              <span className="text-zinc-400">
                No merged file yet (multi-chunk concat is async / pipeline — see ADR-003).
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled
          className="rounded-full border border-zinc-800 px-6 py-2.5 text-sm font-medium text-zinc-600"
          title="Diagnostics ship in M3"
        >
          Run diagnostic
        </button>
        <Link
          href={`/sessions/${sessionId}/transcript`}
          className="inline-flex justify-center rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-400"
        >
          View transcript
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex justify-center rounded-full bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-500"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
