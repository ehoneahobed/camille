import { requireUserSession } from "@/lib/api/auth-helpers";
import { getGeminiApiKey } from "@/lib/config/live";
import { isPastMaxSession } from "@/lib/config/session-limits";
import { prisma } from "@/lib/db";
import { mintGeminiLiveEphemeralToken } from "@/lib/providers/gemini-live-token";
import { allowRealtimeTokenMint } from "@/lib/rate-limit/realtime-token";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }

  try {
    getGeminiApiKey();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Missing API key";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  if (!allowRealtimeTokenMint(gate.session.user.id)) {
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

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
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
  if (isPastMaxSession(practice.startedAt)) {
    return NextResponse.json(
      { error: "Session exceeded maximum duration; end it and start a new one." },
      { status: 403 },
    );
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: gate.session.user.id },
  });

  const minted = await mintGeminiLiveEphemeralToken({
    scenarioId: practice.scenarioId,
    startingCefr: settings?.startingCefr ?? "B1",
    voiceId: settings?.voiceId,
  });

  console.info("[analytics] token_minted", { sessionId });

  return NextResponse.json({
    token: minted.token,
    model: minted.model,
    responseModalities: minted.responseModalities,
  });
}
