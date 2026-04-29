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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-3 text-zinc-400">
        You&apos;re signed in as <span className="text-zinc-200">{session.user.email}</span>.
        Starting level:{" "}
        <span className="text-zinc-200">{settings.startingCefr}</span> · Daily target:{" "}
        <span className="text-zinc-200">{settings.dailyTargetMinutes} min</span>
      </p>
      <p className="mt-8 text-sm text-zinc-500">
        Next: scenario library and live session (M1–M2 in the implementation plan).
      </p>
    </main>
  );
}
