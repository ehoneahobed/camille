import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

function scenarioLabel(scenarioId: string) {
  return SCENARIOS.find((s) => s.id === scenarioId)?.en ?? scenarioId;
}

export default async function ProgressPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });
  if (!settings) {
    redirect("/onboarding");
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const [weekSessions, recentEnded, totalSessions] = await Promise.all([
    prisma.practiceSession.findMany({
      where: {
        userId: session.user.id,
        status: "ENDED",
        endedAt: { gte: weekStart },
      },
      select: { startedAt: true, endedAt: true },
    }),
    prisma.practiceSession.findMany({
      where: { userId: session.user.id, status: "ENDED" },
      orderBy: { endedAt: "desc" },
      take: 5,
      select: { id: true, scenarioId: true, endedAt: true, startedAt: true },
    }),
    prisma.practiceSession.count({ where: { userId: session.user.id } }),
  ]);

  const weekMinutes = Math.round(
    weekSessions.reduce((acc, p) => {
      if (!p.endedAt) return acc;
      return acc + (p.endedAt.getTime() - p.startedAt.getTime()) / 60000;
    }, 0),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Progress</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">Your rhythm</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
        Snapshot for the last seven days. Deeper charts (heat grid, diagnostic trends) are on the roadmap — for
        now, use{" "}
        <Link href="/history" className="text-wine-2 underline-offset-4 transition-colors hover:text-wine hover:underline">
          History
        </Link>{" "}
        for every session.
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-rule bg-canvas-2/60 p-5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">French this week</dt>
          <dd className="mt-2 font-display text-4xl tabular-nums text-ink">{weekMinutes}</dd>
          <dd className="mt-1 text-sm text-mute">minutes (ended sessions, rolling 7 days)</dd>
        </div>
        <div className="rounded-lg border border-rule bg-canvas-2/60 p-5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Sessions (all time)</dt>
          <dd className="mt-2 font-display text-4xl tabular-nums text-ink">{totalSessions}</dd>
          <dd className="mt-1 text-sm text-mute">Daily target: {settings.dailyTargetMinutes} min</dd>
        </div>
      </dl>

      <section className="mt-12">
        <h2 className="font-display-sm text-xl text-ink">Recent completed</h2>
        <ul className="mt-4 divide-y divide-rule border border-rule rounded-lg bg-canvas-2/40">
          {recentEnded.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-mute">Complete a session to see it here.</li>
          ) : (
            recentEnded.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sessions/${s.id}/transcript`}
                  className="flex flex-col gap-1 px-4 py-4 transition-colors hover:bg-canvas-2/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-display-sm text-[17px] text-ink">
                    {scenarioLabel(s.scenarioId)}
                  </span>
                  <span className="font-mono text-[12px] text-mute">
                    {(s.endedAt ?? s.startedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="mt-10 text-sm text-mute">
        <Link href="/dashboard" className="editorial-link transition-colors hover:text-ink">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
