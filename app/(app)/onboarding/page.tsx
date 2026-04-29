import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { completeOnboarding } from "./actions";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
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

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold">Set up your profile</h1>
      <p className="mt-2 text-sm text-zinc-400">
        A few defaults so Camille can match your level. You can change these later in
        settings.
      </p>
      <OnboardingForm action={completeOnboarding} />
    </main>
  );
}
