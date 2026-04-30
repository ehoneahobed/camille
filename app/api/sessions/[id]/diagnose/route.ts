import { requireUserSession } from "@/lib/api/auth-helpers";
import { runDiagnosticForSession } from "@/lib/diagnostics/run-diagnostic-job";
import { prisma } from "@/lib/db";
import { after } from "next/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }
  const { id: sessionId } = await ctx.params;

  const practice = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: gate.session.user.id, status: "ENDED" },
    include: { diagnostic: true },
  });
  if (!practice) {
    return NextResponse.json({ error: "Session not found or not ended" }, { status: 404 });
  }

  const turnCount = await prisma.turn.count({ where: { sessionId } });
  if (turnCount === 0) {
    return NextResponse.json(
      { error: "Diagnostics require at least one saved transcript turn." },
      { status: 400 },
    );
  }
  if (!practice.audioS3Key) {
    return NextResponse.json(
      { error: "Diagnostics require merged audio (audioS3Key). Try a longer session or S3/local finalize." },
      { status: 400 },
    );
  }

  const d = practice.diagnostic;
  if (d?.status === "DONE") {
    return NextResponse.json({ ok: true, status: "DONE", message: "Diagnostic already complete." });
  }
  if (d?.status === "RUNNING") {
    return NextResponse.json(
      { ok: true, status: "RUNNING", message: "Diagnostic in progress." },
      { status: 202 },
    );
  }
  if (d?.status === "QUEUED") {
    // Do not schedule another `after()` — the first POST already did; cron can pick up stuck rows.
    return NextResponse.json({ ok: true, status: "QUEUED", message: "Already queued." }, { status: 202 });
  }

  await prisma.diagnostic.upsert({
    where: { sessionId },
    create: {
      sessionId,
      status: "QUEUED",
    },
    update: {
      status: "QUEUED",
      error: null,
      runAt: null,
      aggregateScore: null,
    },
  });

  console.info("[analytics] diagnostic_queued", { sessionId });

  after(() => {
    void runDiagnosticForSession(sessionId).catch((err) => {
      console.error("[runDiagnosticForSession]", err);
    });
  });

  return NextResponse.json({ ok: true, status: "QUEUED" }, { status: 202 });
}
