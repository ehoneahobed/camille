import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-24">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Camille
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50">
          The French friend who switches back.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          Voice-first practice with a bilingual partner: French by default, English
          when you need it, then back into French until it sticks.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/sign-up"
          className="rounded-full bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-950 hover:bg-white"
        >
          Start
        </Link>
        <Link
          href="/sign-in"
          className="rounded-full border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-200 hover:border-zinc-400"
        >
          Sign in
        </Link>
      </div>
      <p className="text-sm text-zinc-500">
        Static prototype UI lives in{" "}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">prototype/</code>.
      </p>
    </main>
  );
}
