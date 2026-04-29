import { requireUserSession } from "@/lib/api/auth-helpers";
import { prisma } from "@/lib/db";
import { assertAllowedAudioContentType } from "@/lib/s3/presign-chunk";
import { getLocalAudioRootDir, localChunkFilePath } from "@/lib/storage/local-audio-paths";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_BYTES = 25 * 1024 * 1024;

function safeSessionId(id: string): boolean {
  return /^[a-z0-9_-]{12,128}$/i.test(id);
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ sessionId: string; chunkIndex: string }> },
) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }

  const { sessionId, chunkIndex: chunkIndexParam } = await ctx.params;
  if (!safeSessionId(sessionId)) {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  const chunkIndex = Number.parseInt(chunkIndexParam, 10);
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex > 10_000) {
    return NextResponse.json({ error: "Invalid chunkIndex" }, { status: 400 });
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

  const contentType = request.headers.get("content-type") ?? "";
  try {
    assertAllowedAudioContentType(contentType);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid content type";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const len = request.headers.get("content-length");
  if (len) {
    const n = Number.parseInt(len, 10);
    if (Number.isFinite(n) && n > MAX_BYTES) {
      return NextResponse.json({ error: "Chunk too large" }, { status: 413 });
    }
  }

  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "Chunk too large" }, { status: 413 });
  }

  const dest = localChunkFilePath(sessionId, chunkIndex);
  const root = path.resolve(getLocalAudioRootDir());
  const absDest = path.resolve(dest);
  if (!absDest.startsWith(root + path.sep) && absDest !== root) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  await mkdir(path.dirname(absDest), { recursive: true });
  await writeFile(absDest, buf);

  console.info("[analytics] audio_chunk_uploaded", {
    sessionId,
    chunkIndex,
    backend: "local",
  });

  return new NextResponse(null, { status: 204 });
}
