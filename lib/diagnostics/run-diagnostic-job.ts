import { prisma } from "@/lib/db";
import { computeAggregateDiagnosticScore } from "@/lib/diagnostics/aggregate-score";
import { runGrammarAndVocabularyPass } from "@/lib/diagnostics/grammar";
import { loadSessionAudioForDiagnostics } from "@/lib/diagnostics/load-session-audio";
import { runGeminiPronunciationTranscriptProxy } from "@/lib/providers/gemini-pronunciation-assessment";
import { runSessionPronunciationAssessment } from "@/lib/providers/pronunciation";
import type { PronunciationScoresV1 } from "@/lib/diagnostics/schemas";

function formatTranscriptLines(
  turns: Array<{ index: number; role: string; text: string }>,
): string {
  return turns.map((t) => `[${t.index}] ${t.role}: ${t.text}`).join("\n");
}

/**
 * Picks one `QUEUED` diagnostic row, flips to `RUNNING`, loads session audio + turns,
 * then runs pronunciation (audio when `audioS3Key` exists; otherwise transcript-only Gemini proxy)
 * and Gemini grammar/vocabulary.
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
        user: { include: { settings: true } },
      },
    });
    if (!practice) {
      await prisma.diagnostic.update({
        where: { sessionId },
        data: { status: "FAILED", error: "Session missing" },
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

    const fullTranscript = formatTranscriptLines(practice.turns);
    const learnerCefr = practice.user.settings?.startingCefr ?? "B1";

    const grammarPromise = runGrammarAndVocabularyPass({
      fullTranscript,
      learnerCefr,
    });

    const pronunciationPromise: Promise<PronunciationScoresV1> = (async () => {
      const key = practice.audioS3Key?.trim();
      if (!key) {
        return runGeminiPronunciationTranscriptProxy(userLines);
      }
      const audioBlob = await loadSessionAudioForDiagnostics(key);
      return runSessionPronunciationAssessment({
        audioBytes: audioBlob.bytes,
        mimeType: audioBlob.mimeType,
        referenceText: userLines,
      });
    })();

    const [pronunciationScoresJson, grammarBundle] = await Promise.all([
      pronunciationPromise,
      grammarPromise,
    ]);

    const grammarFeedbackJson = grammarBundle.grammar;
    const vocabularyJson = grammarBundle.vocabulary;

    const aggregateScore = computeAggregateDiagnosticScore({
      pronunciation: pronunciationScoresJson,
      grammar: grammarFeedbackJson,
      vocabulary: vocabularyJson,
    });

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
