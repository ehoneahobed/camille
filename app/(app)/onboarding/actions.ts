"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const CEFR = ["A2", "B1", "B2", "C1"] as const;

export async function completeOnboarding(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const existing = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    redirect("/dashboard");
  }

  const startingCefrRaw = String(formData.get("startingCefr") ?? "B1");
  const startingCefr = CEFR.includes(startingCefrRaw as (typeof CEFR)[number])
    ? startingCefrRaw
    : "B1";

  const dailyTargetMinutes = Math.min(
    120,
    Math.max(10, Number(formData.get("dailyTargetMinutes")) || 30),
  );

  await prisma.userSettings.create({
    data: {
      userId: session.user.id,
      voiceId: String(formData.get("voiceId") ?? "camille"),
      startingCefr,
      dailyTargetMinutes,
      remindersEnabled: formData.get("remindersEnabled") === "on",
      transcriptRetention: formData.get("transcriptRetention") === "on",
      timezone: String(formData.get("timezone") ?? "").trim() || null,
    },
  });

  redirect("/dashboard");
}
