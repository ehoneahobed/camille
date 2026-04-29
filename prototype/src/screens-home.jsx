// Home / dashboard. UI in English. The French phrase in the hero is intentional learning content.
const HomeScreen = ({ onStart, onOpenSession, onNav, sessions, weekMinutes, onSignOut }) => {
  const today = 'Monday, April 27';
  return (
    <PageFrame>
      <AppNav current="home" onNav={onNav} onSignOut={onSignOut} />

      <main className="px-10 max-w-[1100px] mx-auto pt-4 pb-24">
        <div className="flex items-baseline justify-between mb-12">
          <MetaLabel>{today}</MetaLabel>
          <p className="text-[13px] text-mute tabular">
            <span className="text-ink font-medium">{weekMinutes}</span>
            <span className="text-mute"> minutes of French this week</span>
            <span className="text-mute2"> · </span>
            <span className="text-ink font-medium">18-day streak</span>
          </p>
        </div>

        <section className="mb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-wine mb-5">
            Pick up the thread
          </p>
          <h1 className="font-display text-[96px] leading-[0.92] tracking-[-0.025em] text-ink mb-8 max-w-[14ch]">
            Today's <span className="italic text-wine">conversation</span>.
          </h1>
          <p className="font-display-sm text-[19px] leading-[1.55] text-ink2 mb-3 max-w-[52ch]">
            Camille is ready when you are. Pick a scenario or let things unfold — she'll lead in French and switch to English the moment you need her to.
          </p>
          <p className="font-display-sm text-[15px] italic text-mute mb-10 max-w-[52ch]">
            Yesterday's loose end: <span className="text-ink2 not-italic">the nasal vowel /ɑ̃/ in “allongé”</span>.
          </p>
          <div className="flex items-center gap-5">
            <PrimaryButton onClick={onStart} className="px-8 py-4 text-[15px]">
              Start a session
              <IconArrow size={15} />
            </PrimaryButton>
            <TextLink onClick={() => onNav('scenarios')}>Browse scenarios →</TextLink>
          </div>
        </section>

        <Rule className="mb-10" />

        <section>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display-sm text-[22px] tracking-[-0.01em] text-ink">Recent sessions</h2>
            <button onClick={() => onNav('history')} className="text-[12px] text-mute hover:text-ink editorial-link">
              See all {sessions.length} →
            </button>
          </div>

          <ul className="divide-y divide-rule">
            {sessions.slice(0, 4).map((s) => (
              <li key={s.id}>
                <button onClick={() => onOpenSession(s.id)}
                  className="w-full text-left grid grid-cols-12 gap-6 py-6 group hover:bg-canvas2/60 transition-colors px-2 -mx-2">
                  <div className="col-span-2 tabular text-[13px] text-mute pt-1">{s.date}</div>
                  <div className="col-span-6">
                    <div className="font-display-sm text-[20px] tracking-[-0.005em] text-ink group-hover:text-wine transition-colors">
                      {s.scenario}
                    </div>
                    <div className="text-[13px] text-mute mt-1 italic font-display-sm leading-snug truncate max-w-[58ch]">
                      {s.excerpt}
                    </div>
                  </div>
                  <div className="col-span-2 tabular text-[13px] text-ink2 pt-1">
                    {s.duration}
                    <div className="text-[11px] text-mute mt-0.5">{s.turns} turns</div>
                  </div>
                  <div className="col-span-2 pt-1 flex items-start justify-end">
                    {s.diagnostic === 'run' ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-wine">
                        <span className="w-1 h-1 bg-wine rounded-full" />
                        {s.score}/100
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-mute2">
                        Not analysed
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </PageFrame>
  );
};

Object.assign(window, { HomeScreen });
