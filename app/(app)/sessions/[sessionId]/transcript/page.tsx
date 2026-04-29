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
    },
  });
  if (!practice) {
    notFound();
  }

  const scenarioLabel =
    SCENARIOS.find((s) => s.id === practice.scenarioId)?.en ?? practice.scenarioId;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Transcript
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-50">{scenarioLabel}</h1>
        </div>
        {practice.status === "ENDED" ? (
          <Link
            href={`/sessions/${sessionId}/complete`}
            className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            ← Summary
          </Link>
        ) : (
          <Link
            href={`/live/${sessionId}`}
            className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            ← Back to live
          </Link>
        )}
      </div>

      <ol className="mt-10 space-y-4">
        {practice.turns.map((t) => (
          <li
            key={t.id}
            className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
              t.role === "USER"
                ? "border-zinc-700 bg-zinc-900/30 text-zinc-200"
                : "border-zinc-800 bg-zinc-950/60 text-zinc-100"
            }`}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t.role === "USER" ? "You" : "Camille"} · #{t.index}
            </span>
            <p className="mt-1 whitespace-pre-wrap">{t.text}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
