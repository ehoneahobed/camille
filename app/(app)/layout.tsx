import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-6 py-4 sm:px-10">
        <Link
          href="/dashboard"
          className="font-display-sm text-[20px] tracking-[-0.01em] text-ink transition-colors hover:text-wine"
        >
          Camille<span className="text-wine">.</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-6 text-[13px] text-mute">
          <Link href="/dashboard" className="transition-colors hover:text-ink">
            Home
          </Link>
          <Link href="/scenarios" className="transition-colors hover:text-ink">
            Scenarios
          </Link>
          <Link href="/history" className="transition-colors hover:text-ink">
            History
          </Link>
          <span className="hidden text-rule-2 sm:inline">·</span>
          <span className="max-w-[200px] truncate text-mute-2" title={session.user.email}>
            {session.user.email}
          </span>
          <SignOutButton />
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
