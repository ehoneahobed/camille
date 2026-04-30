import { SettingsForm } from "./settings-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
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
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Settings</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">Learning preferences</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
        These values feed your Live tutor prompt and dashboard copy. Signed in as{" "}
        <span className="text-ink">{session.user.email}</span>.
      </p>
      <SettingsForm settings={settings} />
      <p className="mt-10 text-sm text-mute">
        <Link href="/dashboard" className="editorial-link text-mute transition-colors hover:text-ink">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
