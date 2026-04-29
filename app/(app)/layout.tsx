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
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Camille<span className="text-orange-500">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-100">
            Home
          </Link>
          <Link href="/scenarios" className="hover:text-zinc-100">
            Scenarios
          </Link>
          <span className="truncate text-zinc-500" title={session.user.email}>
            {session.user.email}
          </span>
          <SignOutButton />
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
