import { StartPractice } from "./start-practice";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });
  if (!settings) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Home</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">Welcome back</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
        You&apos;re signed in as <span className="text-ink">{session.user.email}</span>. Starting
        level <span className="text-ink">{settings.startingCefr}</span> · Daily target{" "}
        <span className="text-ink">{settings.dailyTargetMinutes} min</span>
      </p>
      <StartPractice />
    </main>
  );
}
