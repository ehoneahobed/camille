import { requireUserSession } from "@/lib/api/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type TurnInput = {
  index: number;
  role: "USER" | "ASSISTANT";
  text: string;
  lang?: string | null;
  kind?: string | null;
  occurredAt: string;
};

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }
  const { id: sessionId } = await ctx.params;

  const practice = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: gate.session.user.id },
  });
  if (!practice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (practice.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Session is not active" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const turnsRaw =
    typeof body === "object" &&
    body !== null &&
    "turns" in body &&
    Array.isArray((body as { turns: unknown }).turns)
      ? (body as { turns: unknown[] }).turns
      : null;

  if (!turnsRaw?.length) {
    return NextResponse.json({ error: "turns array required" }, { status: 400 });
  }

  const turns: TurnInput[] = [];
  for (const t of turnsRaw) {
    if (
      typeof t !== "object" ||
      t === null ||
      typeof (t as TurnInput).index !== "number" ||
      typeof (t as TurnInput).role !== "string" ||
      typeof (t as TurnInput).text !== "string" ||
      typeof (t as TurnInput).occurredAt !== "string"
    ) {
      return NextResponse.json({ error: "Invalid turn payload" }, { status: 400 });
    }
    const role = (t as TurnInput).role;
    if (role !== "USER" && role !== "ASSISTANT") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    turns.push({
      index: (t as TurnInput).index,
      role,
      text: (t as TurnInput).text,
      lang: (t as TurnInput).lang ?? null,
      kind: (t as TurnInput).kind ?? null,
      occurredAt: (t as TurnInput).occurredAt,
    });
  }

  const maxAgg = await prisma.turn.aggregate({
    where: { sessionId },
    _max: { index: true },
  });
  const maxIndex = maxAgg._max.index ?? -1;
  const minNew = Math.min(...turns.map((t) => t.index));
  if (minNew !== maxIndex + 1) {
    return NextResponse.json(
      { error: `Expected next index ${maxIndex + 1}, got ${minNew}` },
      { status: 400 },
    );
  }

  for (let i = 1; i < turns.length; i++) {
    if (turns[i].index !== turns[i - 1].index + 1) {
      return NextResponse.json({ error: "Turn indices must be contiguous" }, { status: 400 });
    }
  }

  await prisma.turn.createMany({
    data: turns.map((t) => ({
      sessionId,
      index: t.index,
      role: t.role,
      text: t.text,
      lang: t.lang,
      kind: t.kind,
      occurredAt: new Date(t.occurredAt),
    })),
  });

  console.info("[analytics] turn_batch_written", { sessionId, count: turns.length });

  return NextResponse.json({ ok: true, written: turns.length });
}
