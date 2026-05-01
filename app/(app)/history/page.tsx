import type { DiagnosticStatus, PracticeSession } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

function scenarioLabel(scenarioId: string) {
  return SCENARIOS.find((s) => s.id === scenarioId)?.en ?? scenarioId;
}

function durationLabel(practice: PracticeSession) {
  if (practice.status === "ENDED" && practice.endedAt) {
    const sec = Math.max(
      0,
      Math.round((practice.endedAt.getTime() - practice.startedAt.getTime()) / 1000),
    );
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }
  if (practice.status === "IN_PROGRESS") {
    return "In progress";
  }
  return "—";
}

function diagnosticBadge(status: DiagnosticStatus | undefined | null) {
  const s = status ?? "NOT_RUN";
  const styles: Record<DiagnosticStatus, string> = {
    NOT_RUN: "border-rule bg-canvas-2/80 text-mute",
    QUEUED: "border-rule-2 bg-canvas-2/80 text-ink-2",
    RUNNING: "border-wine/30 bg-wine/10 text-wine",
    DONE: "border-rule-2 bg-canvas-3/80 text-ink",
    FAILED: "border-wine/40 bg-wine/15 text-wine",
  };
  const labels: Record<DiagnosticStatus, string> = {
    NOT_RUN: "Not run",
    QUEUED: "Queued",
    RUNNING: "Running",
    DONE: "Done",
    FAILED: "Failed",
  };
  return { label: labels[s], className: styles[s] };
}

export default async function HistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const practices = await prisma.practiceSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { diagnostic: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">History</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">Your sessions</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
        Ended sessions with saved turns can run diagnostics. Merged session audio improves pronunciation
        scores; without it, a transcript-only proxy is used.
      </p>

      <div className="mt-10 overflow-x-auto rounded-lg border border-rule">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-rule bg-canvas-2/50 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Scenario</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Diagnostic</th>
              <th className="px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {practices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-mute">
                  No sessions yet. Start from{" "}
                  <Link href="/scenarios" className="text-ink underline-offset-4 hover:underline">
                    Scenarios
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              practices.map((p) => {
                const badge = diagnosticBadge(p.diagnostic?.status);
                const d = p.diagnostic;
                const ended = p.status === "ENDED";
                return (
                  <tr key={p.id} className="border-b border-rule last:border-0 hover:bg-canvas-2/30">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">
                      {p.startedAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-ink">{scenarioLabel(p.scenarioId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-2">{durationLabel(p)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      {d?.status === "FAILED" && d.error ? (
                        <span className="mt-1 block max-w-[200px] truncate text-[11px] text-wine" title={d.error}>
                          {d.error}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {ended ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/sessions/${p.id}/transcript`}
                            className="text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
                          >
                            Transcript
                          </Link>
                          <Link
                            href={`/sessions/${p.id}/diagnostic`}
                            className="text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
                          >
                            Diagnostic
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/live/${p.id}`}
                          className="text-wine underline-offset-4 transition-colors hover:underline"
                        >
                          Resume
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
