import { StartPractice } from "./start-practice";
import type { PracticeStatus } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

function scenarioLabel(scenarioId: string) {
  return SCENARIOS.find((s) => s.id === scenarioId)?.en ?? scenarioId;
}

function formatSessionDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function sessionDuration(p: {
  startedAt: Date;
  endedAt: Date | null;
  status: PracticeStatus;
}) {
  if (p.status === "ENDED" && p.endedAt) {
    const sec = Math.max(
      0,
      Math.round((p.endedAt.getTime() - p.startedAt.getTime()) / 1000),
    );
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }
  return "—";
}

function excerptFromTurns(turns: { role: string; text: string }[]) {
  const t =
    turns.find((x) => x.role === "ASSISTANT" && x.text.trim()) ??
    turns.find((x) => x.text.trim());
  if (!t?.text) return "—";
  const s = t.text.replace(/\s+/g, " ").trim();
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

export default async function DashboardPage() {
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

  const weekSessions = await prisma.practiceSession.findMany({
    where: {
      userId: session.user.id,
      status: "ENDED",
      endedAt: { gte: weekStart },
    },
    select: { startedAt: true, endedAt: true },
  });

  const weekMinutes = Math.round(
    weekSessions.reduce((acc, p) => {
      if (!p.endedAt) return acc;
      return acc + (p.endedAt.getTime() - p.startedAt.getTime()) / 60000;
    }, 0),
  );

  const recent = await prisma.practiceSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 4,
    include: {
      diagnostic: true,
      turns: { orderBy: { index: "asc" }, take: 4, select: { role: true, text: true } },
      _count: { select: { turns: true } },
    },
  });

  const totalCount = await prisma.practiceSession.count({
    where: { userId: session.user.id },
  });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-4 sm:px-10">
      <div className="mb-12 flex flex-wrap items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{today}</span>
        <p className="text-[13px] text-mute tabular-nums">
          <span className="font-medium text-ink">{weekMinutes}</span>
          <span className="text-mute"> minutes of French this week</span>
        </p>
      </div>

      <section className="mb-20">
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-wine">Pick up the thread</p>
        <h1 className="mb-8 max-w-[14ch] font-display text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.92] tracking-[-0.025em] text-ink">
          Today&apos;s <span className="italic text-wine">conversation</span>.
        </h1>
        <p className="mb-3 max-w-[52ch] font-display-sm text-[19px] leading-[1.55] text-ink-2">
          Camille is ready when you are. Pick a scenario or let things unfold — she&apos;ll lead in French and
          switch to English the moment you need her to.
        </p>
        <p className="mb-10 max-w-[52ch] font-display-sm text-[15px] italic text-mute">
          Your level:{" "}
          <span className="text-ink-2 not-italic">
            {settings.startingCefr} · {settings.dailyTargetMinutes} min daily target
          </span>
          .
        </p>
        <StartPractice />
      </section>

      <div className="mb-10 h-px bg-rule" />

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-display-sm text-[22px] tracking-[-0.01em] text-ink">Recent sessions</h2>
          <Link
            href="/history"
            className="text-[12px] text-mute editorial-link transition-colors hover:text-ink"
          >
            See all {totalCount > 0 ? `(${totalCount})` : ""} →
          </Link>
        </div>

        <ul className="divide-y divide-rule">
          {recent.length === 0 ? (
            <li className="py-10 text-sm text-mute">No sessions yet. Start one above.</li>
          ) : (
            recent.map((s) => {
              const href = s.status === "ENDED" ? `/sessions/${s.id}/transcript` : `/live/${s.id}`;
              const diag = s.diagnostic;
              const score =
                diag?.status === "DONE" && diag.aggregateScore != null ? diag.aggregateScore : null;

              return (
                <li key={s.id}>
                  <Link
                    href={href}
                    className="group grid w-full grid-cols-12 gap-4 px-2 py-6 text-left transition-colors hover:bg-canvas-2/60 sm:gap-6"
                  >
                    <div className="col-span-12 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mute sm:col-span-2 sm:tabular-nums">
                      {formatSessionDate(s.startedAt)}
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <div className="font-display-sm text-[20px] tracking-[-0.005em] text-ink transition-colors group-hover:text-wine">
                        {scenarioLabel(s.scenarioId)}
                      </div>
                      <div className="mt-1 max-w-[58ch] truncate font-display-sm text-[13px] italic leading-snug text-mute">
                        {excerptFromTurns(s.turns)}
                      </div>
                    </div>
                    <div className="col-span-6 font-mono text-[13px] text-ink-2 sm:col-span-2 sm:tabular-nums">
                      {sessionDuration(s)}
                      <div className="mt-0.5 text-[11px] text-mute">{s._count.turns} turns</div>
                    </div>
                    <div className="col-span-6 flex items-start justify-end pt-1 sm:col-span-2">
                      {score != null ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-wine">
                          <span className="h-1 w-1 rounded-full bg-wine" />
                          {score}/100
                        </span>
                      ) : diag?.status === "FAILED" ? (
                        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-wine">
                          Failed
                        </span>
                      ) : diag?.status === "QUEUED" || diag?.status === "RUNNING" ? (
                        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
                          {diag.status === "QUEUED" ? "Queued" : "Running"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mute-2">
                          Not analysed
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </main>
  );
}
