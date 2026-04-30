"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const CEFR = ["A2", "B1", "B2", "C1"] as const;
const VOICES = ["camille", "leo", "nour"] as const;

/**
 * Updates the signed-in user's `UserSettings` (same fields as onboarding).
 */
export async function updateUserSettings(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const existing = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });
  if (!existing) {
    redirect("/onboarding");
  }

  const startingCefrRaw = String(formData.get("startingCefr") ?? "B1");
  const startingCefr = CEFR.includes(startingCefrRaw as (typeof CEFR)[number])
    ? startingCefrRaw
    : "B1";

  const voiceIdRaw = String(formData.get("voiceId") ?? "camille").toLowerCase();
  const voiceId = VOICES.includes(voiceIdRaw as (typeof VOICES)[number])
    ? voiceIdRaw
    : "camille";

  const dailyTargetMinutes = Math.min(
    120,
    Math.max(10, Number(formData.get("dailyTargetMinutes")) || 30),
  );

  await prisma.userSettings.update({
    where: { userId: session.user.id },
    data: {
      voiceId,
      startingCefr,
      dailyTargetMinutes,
      remindersEnabled: formData.get("remindersEnabled") === "on",
      transcriptRetention: formData.get("transcriptRetention") === "on",
      timezone: String(formData.get("timezone") ?? "").trim() || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
}
