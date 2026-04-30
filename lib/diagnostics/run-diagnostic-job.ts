import { prisma } from "@/lib/db";

/**
 * Picks one `QUEUED` diagnostic row, flips to `RUNNING`, then fills stub results (M3).
 * Azure pronunciation + Gemini grammar/vocab ship in M3-T05–T08; this job proves the pipeline + UI.
 */
export async function runDiagnosticForSession(sessionId: string): Promise<void> {
  const claimed = await prisma.diagnostic.updateMany({
    where: { sessionId, status: "QUEUED" },
    data: { status: "RUNNING" },
  });
  if (claimed.count === 0) {
    return;
  }

  try {
    const practice = await prisma.practiceSession.findFirst({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { index: "asc" } },
      },
    });
    if (!practice) {
      await prisma.diagnostic.update({
        where: { sessionId },
        data: { status: "FAILED", error: "Session missing" },
      });
      return;
    }
    if (!practice.audioS3Key) {
      await prisma.diagnostic.update({
        where: { sessionId },
        data: { status: "FAILED", error: "Missing audioS3Key (finalize audio first)" },
      });
      return;
    }
    const turnCount = await prisma.turn.count({ where: { sessionId } });
    if (turnCount === 0) {
      await prisma.diagnostic.update({
        where: { sessionId },
        data: { status: "FAILED", error: "No transcript turns" },
      });
      return;
    }

    const userLines = practice.turns
      .filter((t) => t.role === "USER")
      .map((t) => t.text)
      .join("\n");

    const pronunciationScoresJson = {
      v: 1,
      note: "Azure Speech pronunciation assessment not configured (M3-T05).",
      placeholder: true,
    };

    const grammarFeedbackJson = {
      v: 1,
      note: "Gemini Flash grammar pass not configured (M3-T07).",
      transcriptPreview: userLines.slice(0, 500),
      items: [] as { line: string; hint: string }[],
    };

    const vocabularyJson = {
      v: 1,
      comfortable: [] as string[],
      stumbled: [] as string[],
      note: "Structured vocabulary pass pending (M3-T08).",
    };

    /** Simple placeholder until Azure + Gemini scores exist (M3-T09). */
    const aggregateScore = 0;

    await prisma.diagnostic.update({
      where: { sessionId },
      data: {
        status: "DONE",
        pronunciationScoresJson,
        grammarFeedbackJson,
        vocabularyJson,
        aggregateScore,
        runAt: new Date(),
        error: null,
      },
    });

    console.info("[analytics] diagnostic_done", { sessionId, aggregateScore });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Diagnostic failed";
    await prisma.diagnostic.update({
      where: { sessionId },
      data: { status: "FAILED", error: message },
    });
    console.error("[diagnostic]", sessionId, e);
  }
}
