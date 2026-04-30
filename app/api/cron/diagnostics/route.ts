import { runDiagnosticForSession } from "@/lib/diagnostics/run-diagnostic-job";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Optional safety net: process stuck `QUEUED` rows if `after()` did not run (e.g. process crash).
 * Configure Vercel Cron `GET /api/cron/diagnostics` with header `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 501 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queued = await prisma.diagnostic.findMany({
    where: { status: "QUEUED" },
    take: 15,
    orderBy: { id: "asc" },
    select: { sessionId: true },
  });

  for (const row of queued) {
    await runDiagnosticForSession(row.sessionId);
  }

  return NextResponse.json({ ok: true, processed: queued.length });
}
