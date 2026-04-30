import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="px-6 pb-6 pt-8 sm:px-10">
        <Link href="/" className="font-display-sm text-[20px] tracking-[-0.01em] hover:text-wine">
          Camille<span className="text-wine">.</span>
        </Link>
      </header>
      <main className="mx-auto max-w-2xl flex-1 px-6 pb-16 sm:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Legal</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.02em] sm:text-5xl">Terms of use</h1>
        <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
          This page is a placeholder. Commercial terms, acceptable use, subscription rules, and
          liability limits will be drafted with counsel before public launch.
        </p>
        <p className="mt-8">
          <Link href="/" className="editorial-link text-[13px] text-mute hover:text-ink">
            ← Back home
          </Link>
        </p>
      </main>
    </div>
  );
}
