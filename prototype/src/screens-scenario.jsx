// Scenario picker (in-flow) AND scenario library (top-level), pre-session check, history, progress, settings.

const ScenarioPicker = ({ onCancel, onStart }) => {
  const [selected, setSelected] = React.useState('freestyle');
  return (
    <PageFrame>
      <TopBar right={<TextLink onClick={onCancel}>Cancel</TextLink>} />
      <main className="px-10 max-w-[1100px] mx-auto pt-6 pb-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-wine mb-5">Step 01 of 02 — Frame</p>
        <h1 className="font-display text-[64px] leading-[0.95] tracking-[-0.025em] text-ink mb-4 max-w-[18ch]">
          What would you like to work on today?
        </h1>
        <p className="font-display-sm text-[17px] leading-[1.6] text-ink2 mb-14 max-w-[58ch]">
          The frame influences Camille's register and vocabulary. You can step out of it any time.
        </p>

        <ul className="grid grid-cols-2 gap-x-12 gap-y-1 mb-14">
          {SCENARIOS.map((s, i) => {
            const active = selected === s.id;
            return (
              <li key={s.id}>
                <button onClick={() => setSelected(s.id)}
                  className={'w-full text-left py-6 border-t transition-colors ' + (active ? 'border-ink' : 'border-rule hover:border-rule2')}>
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className={'font-mono text-[10px] tracking-[0.18em] tabular ' + (active ? 'text-wine' : 'text-mute2')}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className={'font-display-sm text-[24px] tracking-[-0.01em] ' + (active ? 'text-ink' : 'text-ink2')}>
                      {s.en}
                    </h3>
                    {active && <IconCheck size={14} className="text-wine ml-1" />}
                  </div>
                  <div className="pl-[3.5rem]">
                    <div className="text-[12px] italic font-display-sm text-mute2 mb-2">{s.fr}</div>
                    <p className="text-[14px] leading-[1.6] text-mute max-w-[44ch]">{s.desc}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-5">
          <PrimaryButton onClick={() => onStart(selected)} className="px-8 py-4 text-[15px]">
            Continue
            <IconArrow size={15} />
          </PrimaryButton>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
            Selected: {SCENARIOS.find((x) => x.id === selected)?.en}
          </span>
        </div>
      </main>
    </PageFrame>
  );
};

// Scenario library — top-level browse, with filters by level.
const ScenarioLibrary = ({ onNav, onStartWith, onSignOut }) => {
  const [level, setLevel] = React.useState('all');
  const filtered = SCENARIOS.filter((s) => level === 'all' || s.level.includes(level));
  return (
    <PageFrame>
      <AppNav current="scenarios" onNav={onNav} onSignOut={onSignOut} />
      <main className="px-10 max-w-[1100px] mx-auto pt-4 pb-24">
        <MetaLabel>Library</MetaLabel>
        <h1 className="font-display text-[64px] leading-[0.95] tracking-[-0.025em] text-ink mt-4 mb-3 max-w-[18ch]">
          Pick a situation. Or invent one.
        </h1>
        <p className="font-display-sm text-[17px] leading-[1.6] text-ink2 mb-12 max-w-[52ch]">
          Each scenario is a starting register, not a script. Camille will follow you wherever the conversation goes.
        </p>

        <div className="flex items-center gap-3 mb-10 border-b border-rule pb-4">
          <MetaLabel className="mr-3">Level</MetaLabel>
          {['all','A2','B1','B2','C1'].map((lv) => (
            <button key={lv} onClick={() => setLevel(lv)}
              className={'text-[12px] font-mono uppercase tracking-[0.16em] px-3 py-1 border transition-colors ' +
                (level === lv ? 'border-ink text-ink bg-ink/[0.04]' : 'border-rule2 text-mute hover:text-ink')}>
              {lv === 'all' ? 'Any' : lv}
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-2 gap-x-12 gap-y-3">
          {filtered.map((s, i) => (
            <li key={s.id}>
              <button onClick={() => onStartWith(s.id)}
                className="w-full text-left py-7 border-t border-rule hover:border-ink transition-colors group">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-mute2">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="font-display-sm text-[24px] tracking-[-0.01em] text-ink group-hover:text-wine transition-colors">{s.en}</h3>
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-wine">{s.level}</span>
                </div>
                <div className="pl-[3.5rem]">
                  <div className="text-[12px] italic font-display-sm text-mute2 mb-2">{s.fr}</div>
                  <p className="text-[14px] leading-[1.6] text-mute max-w-[44ch] mb-3">{s.desc}</p>
                  <div className="flex gap-2">
                    {s.topics.map((t) => (
                      <span key={t} className="text-[10px] font-mono uppercase tracking-[0.14em] text-mute2 border border-rule2 px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </PageFrame>
  );
};

const PreSessionCheck = ({ scenarioId, onCancel, onBegin }) => {
  const t = useTicker(60);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const level = (Math.sin(t * 0.18) * 0.35 + 0.55 + (Math.sin(t * 0.9) * 0.12));
  const bars = 32;

  return (
    <PageFrame>
      <TopBar right={<TextLink onClick={onCancel}>Cancel</TextLink>} />
      <main className="px-10 max-w-[860px] mx-auto pt-6 pb-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-wine mb-5">Step 02 of 02 — Check</p>
        <h1 className="font-display text-[56px] leading-[0.98] tracking-[-0.025em] text-ink mb-4">
          Before we begin.
        </h1>
        <p className="font-display-sm text-[17px] leading-[1.6] text-ink2 mb-14 max-w-[52ch]">
          Camille leads in French and switches to English the moment you ask. Say <span className="italic">« je ne sais pas »</span>, or just ask in English — she'll explain, then guide you back into French.
        </p>

        <div className="border-t border-b border-rule py-10 mb-12">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-4">
              <MetaLabel>Microphone</MetaLabel>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display-sm text-[20px] text-ink">Detected</span>
                <span className="w-1.5 h-1.5 rounded-full bg-wine breath" />
              </div>
              <div className="text-[12px] text-mute mt-1">MacBook Pro · Built-in</div>
            </div>
            <div className="col-span-8">
              <MetaLabel>Audio level</MetaLabel>
              <div className="mt-3 flex items-end gap-[3px] h-12">
                {Array.from({ length: bars }).map((_, i) => {
                  const phase = i / bars;
                  const v = Math.max(0.08, Math.min(1, level * (0.5 + 0.6 * Math.sin(t * 0.22 + phase * 6))));
                  return <span key={i} className="flex-1 bg-ink" style={{ height: `${v * 100}%`, opacity: 0.55 + v * 0.45 }} />;
                })}
              </div>
              <div className="text-[11px] text-mute mt-2 italic">Say something out loud to confirm.</div>
            </div>
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-12">
          <MetaLabel>Selected frame</MetaLabel>
          <span className="font-display-sm text-[18px] text-ink">{scenario?.en} <span className="italic text-mute">— {scenario?.fr}</span></span>
        </div>

        <div className="flex items-center gap-5">
          <PrimaryButton onClick={onBegin} className="px-8 py-4 text-[15px]" autoFocus>
            Begin the conversation
            <IconArrow size={15} />
          </PrimaryButton>
          <TextLink onClick={onCancel}>Change frame</TextLink>
        </div>
      </main>
    </PageFrame>
  );
};

// History — full list view.
const HistoryScreen = ({ onNav, onOpenSession, onSignOut }) => {
  const [filter, setFilter] = React.useState('all');
  const sessions = filter === 'all' ? PAST_SESSIONS : PAST_SESSIONS.filter((s) => s.diagnostic === filter);
  return (
    <PageFrame>
      <AppNav current="history" onNav={onNav} onSignOut={onSignOut} />
      <main className="px-10 max-w-[1100px] mx-auto pt-4 pb-24">
        <MetaLabel>Archive</MetaLabel>
        <h1 className="font-display text-[56px] leading-[0.98] tracking-[-0.025em] text-ink mt-4 mb-12">
          Every conversation, kept.
        </h1>

        <div className="flex items-center gap-3 mb-8 border-b border-rule pb-4">
          <MetaLabel className="mr-3">Show</MetaLabel>
          {[
            { id: 'all', label: 'All' },
            { id: 'run', label: 'Analysed' },
            { id: 'not-run', label: 'Not analysed' },
          ].map((x) => (
            <button key={x.id} onClick={() => setFilter(x.id)}
              className={'text-[12px] font-mono uppercase tracking-[0.16em] px-3 py-1 border transition-colors ' +
                (filter === x.id ? 'border-ink text-ink bg-ink/[0.04]' : 'border-rule2 text-mute hover:text-ink')}>
              {x.label}
            </button>
          ))}
          <span className="ml-auto text-[12px] text-mute tabular">{sessions.length} sessions</span>
        </div>

        <ul className="divide-y divide-rule">
          {sessions.map((s) => (
            <li key={s.id}>
              <button onClick={() => onOpenSession(s.id)}
                className="w-full text-left grid grid-cols-12 gap-6 py-6 group hover:bg-canvas2/60 transition-colors px-2 -mx-2">
                <div className="col-span-2 tabular text-[13px] text-mute pt-1">{s.date}</div>
                <div className="col-span-6">
                  <div className="font-display-sm text-[20px] tracking-[-0.005em] text-ink group-hover:text-wine transition-colors">
                    {s.scenario}
                  </div>
                  <div className="text-[13px] text-mute mt-1 italic font-display-sm leading-snug truncate max-w-[58ch]">{s.excerpt}</div>
                </div>
                <div className="col-span-2 tabular text-[13px] text-ink2 pt-1">
                  {s.duration}<div className="text-[11px] text-mute mt-0.5">{s.turns} turns</div>
                </div>
                <div className="col-span-2 pt-1 flex items-start justify-end">
                  {s.diagnostic === 'run' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-wine">
                      <span className="w-1 h-1 bg-wine rounded-full" />{s.score}/100
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
      </main>
    </PageFrame>
  );
};

// Progress — heat grid + score line + level bar.
const ProgressScreen = ({ onNav, onSignOut }) => {
  return (
    <PageFrame>
      <AppNav current="progress" onNav={onNav} onSignOut={onSignOut} />
      <main className="px-10 max-w-[1100px] mx-auto pt-4 pb-24">
        <MetaLabel>The long view</MetaLabel>
        <h1 className="font-display text-[64px] leading-[0.95] tracking-[-0.025em] text-ink mt-4 mb-12 max-w-[20ch]">
          Five weeks of <span className="italic text-wine">unhurried</span> work.
        </h1>

        {/* Top stats row */}
        <div className="grid grid-cols-4 gap-8 border-t border-b border-rule2 py-10 mb-16">
          <div>
            <MetaLabel>Streak</MetaLabel>
            <div className="font-display text-[56px] tracking-[-0.025em] text-ink tabular leading-none mt-2">
              {PROGRESS.streakDays}<span className="text-[20px] text-mute ml-1">days</span>
            </div>
          </div>
          <div>
            <MetaLabel>This week</MetaLabel>
            <div className="font-display text-[56px] tracking-[-0.025em] text-ink tabular leading-none mt-2">
              {PROGRESS.weekMinutes}<span className="text-[20px] text-mute ml-1">min</span>
            </div>
            <div className="text-[11px] text-mute mt-2">target {PROGRESS.weekTarget}</div>
          </div>
          <div>
            <MetaLabel>Sessions</MetaLabel>
            <div className="font-display text-[56px] tracking-[-0.025em] text-ink tabular leading-none mt-2">
              {PROGRESS.totalSessions}
            </div>
          </div>
          <div>
            <MetaLabel>Estimated level</MetaLabel>
            <div className="font-display text-[56px] tracking-[-0.025em] text-ink tabular leading-none mt-2">
              {PROGRESS.level}
            </div>
            <div className="text-[11px] text-mute mt-2">{Math.round(PROGRESS.levelProgress * 100)}% to {PROGRESS.levelNext}</div>
          </div>
        </div>

        {/* Level bar */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display-sm text-[22px] tracking-[-0.005em] text-ink">Toward {PROGRESS.levelNext}</h2>
            <MetaLabel>Estimated from diagnostic scores</MetaLabel>
          </div>
          <div className="h-[2px] bg-rule2 relative">
            <div className="absolute inset-y-0 left-0 bg-wine" style={{ width: `${PROGRESS.levelProgress * 100}%`, height: '4px', top: '-1px' }} />
          </div>
          <div className="flex justify-between mt-3 text-[11px] font-mono tracking-[0.16em] text-mute2">
            <span>A1</span><span>A2</span><span>B1</span><span>B2</span><span>C1</span><span>C2</span>
          </div>
        </section>

        {/* Heat grid */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display-sm text-[22px] tracking-[-0.005em] text-ink">Daily activity</h2>
            <MetaLabel>Last five weeks</MetaLabel>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {PROGRESS.heat.map((v, i) => {
              const opacity = v === 0 ? 0.07 : 0.25 + v * 0.22;
              return (
                <div key={i} className="aspect-square" style={{ background: '#6B2737', opacity }} title={`${v} session${v === 1 ? '' : 's'}`} />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 text-[11px] font-mono tracking-[0.14em] text-mute2 uppercase">
            <span>Less</span>
            {[0,1,2,3].map((v) => (
              <span key={v} className="w-3 h-3 inline-block" style={{ background: '#6B2737', opacity: v === 0 ? 0.07 : 0.25 + v * 0.22 }} />
            ))}
            <span>More</span>
          </div>
        </section>

        {/* Score line */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display-sm text-[22px] tracking-[-0.005em] text-ink">Pronunciation score</h2>
            <MetaLabel>Recent diagnostics</MetaLabel>
          </div>
          <ScoreChart points={PROGRESS.scoreHistory} />
        </section>
      </main>
    </PageFrame>
  );
};

// SVG line chart, editorial style.
const ScoreChart = ({ points }) => {
  const W = 1000, H = 220, P = 30;
  const xs = points.map((_, i) => P + (i / (points.length - 1)) * (W - 2 * P));
  const ys = points.map((p) => H - P - ((p.score - 50) / 50) * (H - 2 * P));
  const path = xs.map((x, i) => (i === 0 ? `M ${x} ${ys[i]}` : `L ${x} ${ys[i]}`)).join(' ');
  const area = `${path} L ${xs[xs.length - 1]} ${H - P} L ${xs[0]} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]">
      {/* gridlines */}
      {[60, 70, 80, 90].map((s) => {
        const y = H - P - ((s - 50) / 50) * (H - 2 * P);
        return (
          <g key={s}>
            <line x1={P} y1={y} x2={W - P} y2={y} stroke="#E6DFD2" strokeWidth="1" strokeDasharray="2 4" />
            <text x={W - P + 6} y={y + 4} fill="#9A8F80" fontSize="11" fontFamily="JetBrains Mono">{s}</text>
          </g>
        );
      })}
      <path d={area} fill="#6B2737" opacity="0.06" />
      <path d={path} fill="none" stroke="#6B2737" strokeWidth="1.5" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r="3" fill="#FAF8F4" stroke="#6B2737" strokeWidth="1.5" />
          <text x={x} y={H - 8} fill="#9A8F80" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
            {points[i].date}
          </text>
        </g>
      ))}
    </svg>
  );
};

// Settings — preferences for difficulty, voice, daily time, account.
const SettingsScreen = ({ onNav, onSignOut }) => {
  const [voice, setVoice] = React.useState('camille');
  const [difficulty, setDifficulty] = React.useState('B1');
  const [daily, setDaily] = React.useState(30);
  const [reminders, setReminders] = React.useState(true);
  const [transcripts, setTranscripts] = React.useState(true);

  const Row = ({ label, sublabel, children }) => (
    <div className="grid grid-cols-12 gap-8 py-7 border-t border-rule">
      <div className="col-span-4">
        <h3 className="font-display-sm text-[18px] text-ink">{label}</h3>
        {sublabel && <p className="text-[12px] text-mute mt-1 max-w-[34ch] leading-[1.6]">{sublabel}</p>}
      </div>
      <div className="col-span-8">{children}</div>
    </div>
  );

  const Pills = ({ value, onChange, options }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={'text-[12px] font-mono uppercase tracking-[0.16em] px-3 py-2 border transition-colors ' +
            (value === o.value ? 'border-ink text-ink bg-ink/[0.04]' : 'border-rule2 text-mute hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      className={'relative w-10 h-5 rounded-full transition-colors ' + (value ? 'bg-wine' : 'bg-rule2')}>
      <span className={'absolute top-0.5 w-4 h-4 rounded-full bg-canvas transition-all ' + (value ? 'left-[1.4rem]' : 'left-0.5')} />
    </button>
  );

  return (
    <PageFrame>
      <AppNav current="settings" onNav={onNav} onSignOut={onSignOut} />
      <main className="px-10 max-w-[960px] mx-auto pt-4 pb-24">
        <MetaLabel>Account & preferences</MetaLabel>
        <h1 className="font-display text-[56px] leading-[0.98] tracking-[-0.025em] text-ink mt-4 mb-12">Settings.</h1>

        <Row label="Camille's voice" sublabel="Three native French voices, all post-doctoral. They differ in pace and register, not in patience.">
          <Pills value={voice} onChange={setVoice} options={[
            { value: 'camille', label: 'Camille — Paris' },
            { value: 'leo',     label: 'Léo — Lyon' },
            { value: 'nour',    label: 'Nour — Marseille' },
          ]} />
        </Row>

        <Row label="Starting difficulty" sublabel="Camille speaks just above this. Adjust if recent sessions feel too soft or too steep.">
          <Pills value={difficulty} onChange={setDifficulty} options={[
            { value: 'A2', label: 'A2' }, { value: 'B1', label: 'B1' }, { value: 'B2', label: 'B2' }, { value: 'C1', label: 'C1' },
          ]} />
        </Row>

        <Row label="Daily target" sublabel="Soft target. Used for streak math and the weekly summary.">
          <div className="flex items-baseline gap-4">
            <input type="range" min="10" max="60" step="5" value={daily} onChange={(e) => setDaily(parseInt(e.target.value))} className="w-[280px] accent-wine" />
            <span className="font-display text-[28px] tracking-[-0.02em] text-ink tabular">{daily}<span className="text-[14px] text-mute"> min</span></span>
          </div>
        </Row>

        <Row label="Daily reminder" sublabel="A single quiet email at 8pm if you haven't sat down yet. We don't push notifications.">
          <Toggle value={reminders} onChange={setReminders} />
        </Row>

        <Row label="Keep transcripts" sublabel="Stored on your account, exportable as PDF or markdown. Off means we delete them after the diagnostic runs.">
          <Toggle value={transcripts} onChange={setTranscripts} />
        </Row>

        <div className="mt-16 border-t border-rule pt-10 flex items-center justify-between">
          <div>
            <MetaLabel>Account</MetaLabel>
            <p className="font-display-sm text-[18px] text-ink mt-2">emilie.bertrand@example.com</p>
            <p className="text-[12px] text-mute mt-1">Member since Mar 12, 2026 · Plan: monthly · 18 €/mo</p>
          </div>
          <div className="flex items-center gap-4">
            <GhostButton>Export all transcripts</GhostButton>
            <button className="text-[12px] font-mono uppercase tracking-[0.16em] text-wine hover:text-ink2 transition-colors">
              Cancel subscription
            </button>
          </div>
        </div>
      </main>
    </PageFrame>
  );
};

Object.assign(window, { ScenarioPicker, ScenarioLibrary, PreSessionCheck, HistoryScreen, ProgressScreen, SettingsScreen });
