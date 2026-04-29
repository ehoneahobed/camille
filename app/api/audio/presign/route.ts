import { requireUserSession } from "@/lib/api/auth-helpers";
import { getAudioStorageBackend } from "@/lib/config/audio-storage";
import { requireS3Config, getS3KeyPrefix } from "@/lib/config/s3";
import { prisma } from "@/lib/db";
import { allowAudioPresign } from "@/lib/rate-limit/audio-presign";
import { chunkObjectKeyFromPrefix } from "@/lib/s3/chunk-keys";
import { assertAllowedAudioContentType, presignChunkPut } from "@/lib/s3/presign-chunk";
import { NextResponse } from "next/server";

const MAX_CHUNK_INDEX = 10_000;

export async function POST(request: Request) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }

  if (!allowAudioPresign(gate.session.user.id)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId =
    typeof body === "object" &&
    body !== null &&
    "sessionId" in body &&
    typeof (body as { sessionId: unknown }).sessionId === "string"
      ? (body as { sessionId: string }).sessionId
      : "";

  const chunkIndexRaw =
    typeof body === "object" &&
    body !== null &&
    "chunkIndex" in body &&
    typeof (body as { chunkIndex: unknown }).chunkIndex === "number"
      ? (body as { chunkIndex: number }).chunkIndex
      : NaN;

  const contentType =
    typeof body === "object" &&
    body !== null &&
    "contentType" in body &&
    typeof (body as { contentType: unknown }).contentType === "string"
      ? (body as { contentType: string }).contentType
      : "";

  if (!sessionId || !Number.isInteger(chunkIndexRaw) || chunkIndexRaw < 0) {
    return NextResponse.json({ error: "sessionId and non-negative chunkIndex required" }, { status: 400 });
  }
  if (chunkIndexRaw > MAX_CHUNK_INDEX) {
    return NextResponse.json({ error: "chunkIndex too large" }, { status: 400 });
  }

  const practice = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: gate.session.user.id },
  });
  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (practice.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Session is not active" }, { status: 409 });
  }

  const backend = getAudioStorageBackend();

  if (backend === "local") {
    try {
      assertAllowedAudioContentType(contentType || "audio/webm");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid content type";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const keyPrefix = getS3KeyPrefix();
    const key = chunkObjectKeyFromPrefix(keyPrefix, sessionId, chunkIndexRaw);
    const url = new URL(
      `/api/audio/chunk/${encodeURIComponent(sessionId)}/${chunkIndexRaw}`,
      request.url,
    ).toString();
    console.info("[analytics] audio_chunk_presigned", {
      sessionId,
      chunkIndex: chunkIndexRaw,
      backend: "local",
    });
    return NextResponse.json({ storage: "local" as const, url, key });
  }

  let cfg;
  try {
    cfg = requireS3Config();
  } catch (e) {
    const message = e instanceof Error ? e.message : "S3 not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  try {
    const signed = await presignChunkPut({
      cfg,
      sessionId,
      chunkIndex: chunkIndexRaw,
      contentType: contentType || "audio/webm",
    });
    console.info("[analytics] audio_chunk_presigned", { sessionId, chunkIndex: chunkIndexRaw });
    return NextResponse.json({
      storage: "s3" as const,
      url: signed.url,
      key: signed.key,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Presign failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
