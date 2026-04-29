import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  localAudioDbKey,
  localChunksDir,
  localFinalAudioFilePath,
} from "@/lib/storage/local-audio-paths";

function chunkIndexFromFilename(name: string): number | null {
  const m = /^(\d+)\.webm$/i.exec(name);
  return m ? Number.parseInt(m[1], 10) : null;
}

/**
 * Same rules as S3 finalize: one `.webm` chunk → copy to `audio.webm` and set `audioS3Key`; multiple → log pending.
 */
export async function finalizePracticeSessionAudioLocal(sessionId: string): Promise<void> {
  const dir = localChunksDir(sessionId);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return;
  }

  const chunkFiles = names
    .map((n) => ({ n, idx: chunkIndexFromFilename(n) }))
    .filter((x): x is { n: string; idx: number } => x.idx !== null)
    .sort((a, b) => a.idx - b.idx);

  if (chunkFiles.length === 0) {
    return;
  }

  if (chunkFiles.length > 1) {
    console.info("[analytics] audio_concat_pending", {
      sessionId,
      backend: "local",
      chunkCount: chunkFiles.length,
    });
    return;
  }

  const source = path.join(dir, chunkFiles[0].n);
  const dest = localFinalAudioFilePath(sessionId);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(source, dest);

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { audioS3Key: localAudioDbKey(sessionId) },
  });

  console.info("[analytics] audio_finalized_single_chunk", {
    sessionId,
    backend: "local",
    key: localAudioDbKey(sessionId),
  });
}
