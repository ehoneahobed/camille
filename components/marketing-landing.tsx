import { IconArrow, IconCheck } from "@/components/icons";
import Link from "next/link";
import type { ReactNode } from "react";

const howSteps = [
  {
    n: "01",
    t: "Talk in French",
    d: "Pick a scenario — café, work meeting, news debate — or freestyle. Camille opens in French, just slightly above your level. You answer however you can.",
  },
  {
    n: "02",
    t: "Switch when stuck",
    d: "Lost a word? Ask in English. Camille flips into English, explains plainly — the meaning, the context, the cultural why — then hands the turn back to you in French.",
  },
  {
    n: "03",
    t: "Say it back",
    d: "Every English aside ends with a nudge: try it now. Camille waits for you to repeat the phrase in French before the conversation moves on. That is where it sticks.",
  },
] as const;

const methodPoints = [
  {
    t: "French is the default",
    d: "Every turn starts and ends in French. English is the bridge, not the destination — Camille always loops you back.",
  },
  {
    t: "English on demand",
    d: "Ask “what does that mean?” or “how do I say…?” at any time. She answers in clear English, then sets up the French line for you.",
  },
  {
    t: "Repeat-to-continue",
    d: "After an English aside, the conversation pauses until you say the French version yourself. Production beats recognition.",
  },
  {
    t: "Diagnostic, after",
    d: "When the call ends, Camille re-reads everything — pronunciation, grammar, the words that flowed and the ones that stuck — and queues them up for tomorrow.",
  },
] as const;

const pricingBullets = [
  "Unlimited daily sessions",
  "Bilingual hand-offs whenever you need them",
  "Full diagnostic after every call",
  "All scenarios + freestyle",
  "Export transcripts as PDF or markdown",
  "Two-week trial, no card required",
] as const;

function MetaLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{children}</span>
  );
}

export function MarketingLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="flex flex-col gap-4 px-6 pb-6 pt-8 sm:flex-row sm:items-baseline sm:justify-between sm:px-10">
        <Link
          href="/"
          className="font-display-sm text-[20px] tracking-[-0.01em] text-ink transition-colors hover:text-wine"
        >
          Camille<span className="text-wine">.</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] text-mute">
          <a href="#how" className="transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#method" className="transition-colors hover:text-ink">
            The method
          </a>
          <a href="#pricing" className="transition-colors hover:text-ink">
            Pricing
          </a>
          <span className="hidden text-rule-2 sm:inline">·</span>
          <Link href="/sign-in" className="text-ink transition-colors hover:text-wine">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-6 sm:px-10 sm:pt-10">
        <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.22em] text-wine">
          № 01 &nbsp;·&nbsp; Limited edition &nbsp;·&nbsp; Spring 2026
        </p>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="font-display text-[clamp(2.75rem,10vw,8.75rem)] leading-[0.92] tracking-[-0.03em] text-ink">
              The <span className="italic text-wine">French</span> friend
              <br />
              who switches back.
            </h1>
          </div>
          <div className="lg:col-span-4 lg:pb-3">
            <p className="mb-7 max-w-[34ch] font-display-sm text-[17px] leading-[1.55] text-ink-2 sm:text-[19px]">
              Camille is the bilingual friend who speaks French with you — and slips into English to
              explain the bit you missed, then guides you to say it back, in French.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 bg-ink px-7 py-4 text-[14px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-ink-2"
              >
                Start the trial
                <IconArrow size={14} />
              </Link>
              <Link
                href="/sign-in"
                className="editorial-link text-[13px] text-mute transition-colors hover:text-ink"
              >
                I have an account →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-10 border-t border-rule pt-12 sm:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <MetaLabel>A typical hand-off</MetaLabel>
            <p className="mt-3 max-w-[26ch] text-[12px] leading-[1.6] text-mute">
              Ask in English when you are stuck. She answers plainly, then sets you up to say it
              yourself — in French.
            </p>
          </div>
          <div className="space-y-5 lg:col-span-9">
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-1">
                <MetaLabel>C.</MetaLabel>
              </div>
              <p className="font-display text-[clamp(1.25rem,3.5vw,1.75rem)] italic leading-[1.35] tracking-[-0.01em] text-mute sm:col-span-11">
                Vous le prenez sur place ou à emporter ?
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-1">
                <MetaLabel>You</MetaLabel>
              </div>
              <p className="font-display text-[clamp(1.25rem,3.5vw,1.75rem)] leading-[1.35] tracking-[-0.01em] text-ink sm:col-span-11">
                Wait — what does <span className="italic">à emporter</span> mean?
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-1">
                <MetaLabel>
                  C. <span className="text-wine">EN</span>
                </MetaLabel>
              </div>
              <div className="sm:col-span-11">
                <p className="font-display text-[clamp(1.1rem,3vw,1.5rem)] leading-[1.4] tracking-[-0.005em] text-ink-2">
                  “To take away” — the opposite of <span className="italic">sur place</span>, eating
                  in. Try saying{" "}
                  <span className="italic text-ink">« à emporter, s&apos;il vous plaît »</span> back to
                  me.
                </p>
                <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.18em] text-wine">
                  ↳ back to french
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-1">
                <MetaLabel>You</MetaLabel>
              </div>
              <p className="font-display text-[clamp(1.25rem,3.5vw,1.75rem)] leading-[1.35] tracking-[-0.01em] text-ink sm:col-span-11">
                À emporter, s&apos;il vous plaît.
                <span className="ml-2 align-top font-sans text-[14px] font-normal not-italic text-wine">
                  ✓ nailed it
                </span>
              </p>
            </div>
          </div>
        </div>

        <section id="how" className="mt-24 sm:mt-32">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="max-w-[16ch] font-display text-[clamp(2rem,6vw,3.5rem)] leading-none tracking-[-0.025em] text-ink">
              French first.
              <br />
              English when you need it.
            </h2>
            <MetaLabel>How it works</MetaLabel>
          </div>
          <ol className="grid gap-10 border-t border-rule-2 sm:grid-cols-3 sm:gap-12">
            {howSteps.map((step) => (
              <li
                key={step.n}
                className="border-rule-2 sm:border-r sm:pr-8 sm:last:border-r-0 sm:last:pr-0"
              >
                <div className="pt-8">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-wine">{step.n}</span>
                  <h3 className="mb-4 mt-3 font-display text-[clamp(1.5rem,4vw,2.25rem)] tracking-[-0.02em] text-ink">
                    {step.t}
                  </h3>
                  <p className="max-w-[34ch] text-[14px] leading-[1.7] text-ink-2">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="method" className="mt-24 grid gap-10 sm:mt-32 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <MetaLabel>The method</MetaLabel>
            <h2 className="mb-6 mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-[-0.025em] text-ink">
              Like learning <span className="italic text-wine">with a friend</span>,<br />
              not a textbook.
            </h2>
            <p className="max-w-[40ch] font-display-sm text-[17px] leading-[1.65] text-ink-2">
              The friend who lived in Lyon for six years switches to English to explain{" "}
              <span className="italic">verlan</span>, then makes you order the coffee yourself. Camille
              works the same way — bilingual on purpose, French by default.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7">
            {methodPoints.map((p) => (
              <div key={p.t} className="border-t border-rule-2 pt-5">
                <h4 className="mb-2 font-display-sm text-[20px] tracking-[-0.005em] text-ink">{p.t}</h4>
                <p className="max-w-[30ch] text-[13px] leading-[1.65] text-mute">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-24 sm:mt-32">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-none tracking-[-0.025em] text-ink">
              One plan.
            </h2>
            <MetaLabel>Pricing</MetaLabel>
          </div>
          <div className="grid gap-10 border-y border-rule-2 py-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="mb-6 max-w-[44ch] font-display-sm text-[17px] leading-[1.65] text-ink-2">
                Camille is one product. Unlimited conversations, unlimited diagnostics, every scenario,
                no tiers, no upsell. Cancel any time — your transcripts stay yours.
              </p>
              <ul className="space-y-2 text-[14px] text-ink-2">
                {pricingBullets.map((x) => (
                  <li key={x} className="flex items-baseline gap-3">
                    <IconCheck size={12} className="relative top-[2px] shrink-0 text-wine" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start justify-between gap-8 sm:items-end lg:col-span-5">
              <div className="text-left sm:text-right">
                <div className="font-display text-[clamp(4rem,15vw,7.5rem)] leading-none tracking-[-0.03em] text-ink tabular-nums">
                  18<span className="text-[28px] text-mute"> €/mo</span>
                </div>
                <div className="mt-3 text-[12px] text-mute">Or 162 €/year — save two months.</div>
              </div>
              <Link
                href="/sign-up"
                className="inline-flex w-full items-center justify-center gap-2 bg-ink px-7 py-4 text-[14px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-ink-2 sm:mt-8 sm:w-auto"
              >
                Start the trial
                <IconArrow size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-rule px-6 pb-10 pt-12 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-6">
            <span className="font-display-sm text-[16px] text-ink">
              Camille<span className="text-wine">.</span>
            </span>
            <MetaLabel>Paris · Brooklyn · Lisboa</MetaLabel>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[12px] text-mute">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <a href="mailto:hello@camille.app" className="transition-colors hover:text-ink">
              Contact
            </a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
