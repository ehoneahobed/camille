// Marketing landing page. Pitch: bilingual "friend who speaks French with you" —
// drops into English when you need it, but always nudges you back into French.
const LandingScreen = ({ onSignIn, onStart }) => {
  return (
    <PageFrame>
      <header className="px-10 pt-8 pb-6 flex items-baseline justify-between">
        <span className="font-display-sm text-[20px] tracking-[-0.01em] text-ink">
          Camille<span className="text-wine">.</span>
        </span>
        <nav className="flex items-center gap-8">
          <a href="#how" className="text-[13px] text-mute hover:text-ink transition-colors">How it works</a>
          <a href="#method" className="text-[13px] text-mute hover:text-ink transition-colors">The method</a>
          <a href="#pricing" className="text-[13px] text-mute hover:text-ink transition-colors">Pricing</a>
          <span className="text-rule2">·</span>
          <button onClick={onSignIn} className="text-[13px] text-ink hover:text-wine transition-colors">Sign in</button>
        </nav>
      </header>

      {/* Hero */}
      <main className="px-10 max-w-[1200px] mx-auto pt-10 pb-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-wine mb-6">
          № 01 &nbsp;·&nbsp; Limited edition &nbsp;·&nbsp; Spring 2026
        </p>
        <div className="grid grid-cols-12 gap-10 items-end">
          <div className="col-span-8">
            <h1 className="font-display text-[140px] leading-[0.88] tracking-[-0.03em] text-ink">
              The <span className="italic text-wine">French</span> friend<br/>
              who switches back.
            </h1>
          </div>
          <div className="col-span-4 pb-3">
            <p className="font-display-sm text-[19px] leading-[1.55] text-ink2 mb-7 max-w-[34ch]">
              Camille is the bilingual friend who speaks French with you — and slips into English to explain the bit you missed, then guides you to say it back, in French.
            </p>
            <div className="flex items-center gap-4">
              <PrimaryButton onClick={onStart} className="px-7 py-4 text-[14px]">
                Start the trial
                <IconArrow size={14} />
              </PrimaryButton>
              <TextLink onClick={onSignIn}>I have an account →</TextLink>
            </div>
          </div>
        </div>

        {/* Sample exchange — shows the bilingual hand-off */}
        <div className="mt-24 grid grid-cols-12 gap-10 border-t border-rule pt-12">
          <div className="col-span-3">
            <MetaLabel>A typical hand-off</MetaLabel>
            <p className="text-[12px] text-mute mt-3 leading-[1.6] max-w-[26ch]">
              Ask in English when you're stuck. She answers plainly, then sets you up to say it yourself — in French.
            </p>
          </div>
          <div className="col-span-9 space-y-5">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-1"><MetaLabel>C.</MetaLabel></div>
              <p className="col-span-11 font-display text-[28px] leading-[1.35] tracking-[-0.01em] text-mute italic">
                Vous le prenez sur place ou à emporter ?
              </p>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-1"><MetaLabel>You</MetaLabel></div>
              <p className="col-span-11 font-display text-[28px] leading-[1.35] tracking-[-0.01em] text-ink">
                Wait — what does <span className="italic">à emporter</span> mean?
              </p>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-1"><MetaLabel>C. <span className="text-wine">EN</span></MetaLabel></div>
              <div className="col-span-11">
                <p className="font-display text-[24px] leading-[1.4] tracking-[-0.005em] text-ink2">
                  “To take away” — the opposite of <span className="italic">sur place</span>, eating in. Try saying <span className="italic text-ink">« à emporter, s'il vous plaît »</span> back to me.
                </p>
                <p className="text-[12px] font-mono uppercase tracking-[0.18em] text-wine mt-3">
                  ↳ back to french
                </p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-1"><MetaLabel>You</MetaLabel></div>
              <p className="col-span-11 font-display text-[28px] leading-[1.35] tracking-[-0.01em] text-ink">
                À emporter, s'il vous plaît.
                <span className="text-[14px] font-sans not-italic text-wine align-top ml-2">✓ nailed it</span>
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section id="how" className="mt-32">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-display text-[56px] leading-[1] tracking-[-0.025em] text-ink max-w-[16ch]">
              French first.<br/>
              English when you need it.
            </h2>
            <MetaLabel>How it works</MetaLabel>
          </div>
          <ol className="grid grid-cols-3 gap-12 border-t border-rule2">
            {[
              { n: '01', t: 'Talk in French', d: 'Pick a scenario — café, work meeting, news debate — or freestyle. Camille opens in French, just slightly above your level. You answer however you can.' },
              { n: '02', t: 'Switch when stuck', d: "Lost a word? Ask in English. Camille flips into English, explains plainly — the meaning, the context, the cultural why — then hands the turn back to you in French." },
              { n: '03', t: 'Say it back', d: "Every English aside ends with a nudge: try it now. Camille waits for you to repeat the phrase in French before the conversation moves on. That's where it sticks." },
            ].map((step) => (
              <li key={step.n} className="pt-8 border-r last:border-r-0 border-rule2 pr-8 last:pr-0">
                <span className="font-mono text-[10px] tracking-[0.18em] text-wine">{step.n}</span>
                <h3 className="font-display text-[36px] tracking-[-0.02em] text-ink mt-3 mb-4">{step.t}</h3>
                <p className="text-[14px] leading-[1.7] text-ink2 max-w-[34ch]">{step.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Method */}
        <section id="method" className="mt-32 grid grid-cols-12 gap-10">
          <div className="col-span-5">
            <MetaLabel>The method</MetaLabel>
            <h2 className="font-display text-[56px] leading-[1] tracking-[-0.025em] text-ink mt-4 mb-6">
              Like learning <span className="italic text-wine">with a friend</span>,<br/>not a textbook.
            </h2>
            <p className="font-display-sm text-[17px] leading-[1.65] text-ink2 max-w-[40ch]">
              The friend who lived in Lyon for six years switches to English to explain <span className="italic">verlan</span>, then makes you order the coffee yourself. Camille works the same way — bilingual on purpose, French by default.
            </p>
          </div>
          <div className="col-span-7 grid grid-cols-2 gap-8">
            {[
              { t: 'French is the default', d: 'Every turn starts and ends in French. English is the bridge, not the destination — Camille always loops you back.' },
              { t: 'English on demand', d: "Ask “what does that mean?” or “how do I say…?” at any time. She answers in clear English, then sets up the French line for you." },
              { t: 'Repeat-to-continue', d: "After an English aside, the conversation pauses until you say the French version yourself. Production beats recognition." },
              { t: 'Diagnostic, after', d: "When the call ends, Camille re-reads everything — pronunciation, grammar, the words that flowed and the ones that stuck — and queues them up for tomorrow." },
            ].map((p) => (
              <div key={p.t} className="border-t border-rule2 pt-5">
                <h4 className="font-display-sm text-[20px] tracking-[-0.005em] text-ink mb-2">{p.t}</h4>
                <p className="text-[13px] leading-[1.65] text-mute max-w-[30ch]">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-32">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-display text-[56px] leading-[1] tracking-[-0.025em] text-ink">One plan.</h2>
            <MetaLabel>Pricing</MetaLabel>
          </div>
          <div className="grid grid-cols-12 gap-10 border-t border-b border-rule2 py-12">
            <div className="col-span-7">
              <p className="font-display-sm text-[17px] leading-[1.65] text-ink2 mb-6 max-w-[44ch]">
                Camille is one product. Unlimited conversations, unlimited diagnostics, every scenario, no tiers, no upsell. Cancel any time — your transcripts stay yours.
              </p>
              <ul className="text-[14px] text-ink2 space-y-2">
                {['Unlimited daily sessions', 'Bilingual hand-offs whenever you need them', 'Full diagnostic after every call', 'All scenarios + freestyle', 'Export transcripts as PDF or markdown', 'Two-week trial, no card required'].map((x) => (
                  <li key={x} className="flex items-baseline gap-3">
                    <IconCheck size={12} className="text-wine relative top-[2px]" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-5 flex flex-col items-end justify-between">
              <div className="text-right">
                <div className="font-display text-[120px] leading-none tracking-[-0.03em] text-ink tabular">
                  18<span className="text-[28px] text-mute"> €/mo</span>
                </div>
                <div className="text-[12px] text-mute mt-3">Or 162 €/year — save two months.</div>
              </div>
              <PrimaryButton onClick={onStart} className="mt-8 px-7 py-4 text-[14px]">
                Start the trial
                <IconArrow size={14} />
              </PrimaryButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-10 pb-10 pt-12 border-t border-rule">
        <div className="max-w-[1200px] mx-auto flex items-baseline justify-between">
          <div className="flex items-baseline gap-6">
            <span className="font-display-sm text-[16px] text-ink">Camille<span className="text-wine">.</span></span>
            <MetaLabel>Paris · Brooklyn · Lisboa</MetaLabel>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-mute">
            <a className="hover:text-ink" href="#">Privacy</a>
            <a className="hover:text-ink" href="#">Terms</a>
            <a className="hover:text-ink" href="#">Contact</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </PageFrame>
  );
};

Object.assign(window, { LandingScreen });
