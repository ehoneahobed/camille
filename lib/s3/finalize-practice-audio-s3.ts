import { CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { requireS3Config } from "@/lib/config/s3";
import { chunksListPrefix, finalAudioObjectKey } from "@/lib/s3/chunk-keys";
import { getS3ClientForConfig } from "@/lib/s3/s3-client";

function chunkIndexFromKey(key: string): number | null {
  const m = /\/chunks\/(\d+)\.webm$/i.exec(key);
  if (!m) {
    return null;
  }
  return Number.parseInt(m[1], 10);
}

type ListedObject = { Key?: string };

function sortChunkObjects(objects: ListedObject[]): ListedObject[] {
  return [...objects].sort((a, b) => {
    const ia = a.Key ? chunkIndexFromKey(a.Key) : null;
    const ib = b.Key ? chunkIndexFromKey(b.Key) : null;
    return (ia ?? 0) - (ib ?? 0);
  });
}

/**
 * After a session ends: if exactly one chunk exists, copy it to `audio.webm` and set `audioS3Key`.
 * Multiple chunks require a remux pipeline (ffmpeg / Lambda) — see docs/adr/003-audio-concat-s3.md.
 */
export async function finalizePracticeSessionAudioS3(sessionId: string): Promise<void> {
  let cfg;
  try {
    cfg = requireS3Config();
  } catch {
    return;
  }

  const client = getS3ClientForConfig(cfg);
  const prefix = chunksListPrefix(cfg, sessionId);
  const listed: ListedObject[] = [];
  let token: string | undefined;

  do {
    const out = await client.send(
      new ListObjectsV2Command({
        Bucket: cfg.bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    if (out.Contents?.length) {
      listed.push(...out.Contents);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  const chunks = sortChunkObjects(listed).filter((o) => o.Key && chunkIndexFromKey(o.Key) !== null);

  if (chunks.length === 0) {
    return;
  }

  if (chunks.length > 1) {
    console.info("[analytics] audio_concat_pending", {
      sessionId,
      chunkCount: chunks.length,
    });
    return;
  }

  const sourceKey = chunks[0].Key!;
  const destKey = finalAudioObjectKey(cfg, sessionId);

  await client.send(
    new CopyObjectCommand({
      Bucket: cfg.bucket,
      CopySource: `${cfg.bucket}/${sourceKey}`,
      Key: destKey,
    }),
  );

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { audioS3Key: destKey },
  });

  console.info("[analytics] audio_finalized_single_chunk", { sessionId, key: destKey });
}
