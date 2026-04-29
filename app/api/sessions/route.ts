import { requireUserSession } from "@/lib/api/auth-helpers";
import { prisma } from "@/lib/db";
import { isValidScenarioId } from "@/lib/scenarios/seed";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const gate = await requireUserSession();
  if (!gate.session) {
    return gate.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scenarioId =
    typeof body === "object" &&
    body !== null &&
    "scenarioId" in body &&
    typeof (body as { scenarioId: unknown }).scenarioId === "string"
      ? (body as { scenarioId: string }).scenarioId
      : "";

  if (!isValidScenarioId(scenarioId)) {
    return NextResponse.json({ error: "Invalid scenarioId" }, { status: 400 });
  }

  const practice = await prisma.practiceSession.create({
    data: {
      userId: gate.session.user.id,
      scenarioId,
      status: "IN_PROGRESS",
    },
  });

  console.info("[analytics] session_started", { sessionId: practice.id });

  return NextResponse.json({ id: practice.id });
}
