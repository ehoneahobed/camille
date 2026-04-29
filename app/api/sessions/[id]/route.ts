import { requireUserSession } from "@/lib/api/auth-helpers";
import { prisma } from "@/lib/db";
import { finalizePracticeSessionAudio } from "@/lib/audio/finalize-practice-session";
import { after } from "next/server";
import { NextResponse } from "next/server";

async function getOwnedPracticeSession(userId: string, id: string) {
  return prisma.practiceSession.findFirst({
    where: { id, userId },
    include: {
      turns: { orderBy: { index: "asc" }, take: 500 },
      diagnostic: true,
    },
  });
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }
  const { id } = await ctx.params;
  const practice = await getOwnedPracticeSession(gate.session.user.id, id);
  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(practice);
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status =
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    typeof (body as { status: unknown }).status === "string"
      ? (body as { status: string }).status
      : null;

  if (status !== "ENDED") {
    return NextResponse.json({ error: "Only status ENDED is supported" }, { status: 400 });
  }

  const existing = await prisma.practiceSession.findFirst({
    where: { id, userId: gate.session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.practiceSession.update({
    where: { id },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  console.info("[analytics] session_ended", { sessionId: id });

  after(() => {
    void finalizePracticeSessionAudio(id).catch((err) => {
      console.error("[finalizePracticeSessionAudio]", err);
    });
  });

  return NextResponse.json({ ok: true });
}
