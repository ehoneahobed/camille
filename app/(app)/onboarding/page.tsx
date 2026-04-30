import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
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
    <main className="mx-auto max-w-lg px-6 py-12 sm:px-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Onboarding</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">
        Set up your profile
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
        A few defaults so Camille can match your level. You can change these later in settings.
      </p>
      <OnboardingForm action={completeOnboarding} />
      <p className="mt-10">
        <Link href="/" className="editorial-link text-[13px] text-mute hover:text-ink">
          ← Back to marketing site
        </Link>
      </p>
    </main>
  );
}
