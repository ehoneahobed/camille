import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { LiveSessionPanel } from "./live-session-panel";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const practice = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });
  if (!practice) {
    notFound();
  }
  if (practice.status !== "IN_PROGRESS") {
    redirect("/dashboard");
  }

  return (
    <LiveSessionPanel
      sessionId={practice.id}
      scenarioId={practice.scenarioId}
      startedAt={practice.startedAt.toISOString()}
    />
  );
}
