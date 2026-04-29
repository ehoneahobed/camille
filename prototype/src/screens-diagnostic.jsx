// Session ended, diagnostic running, diagnostic results, session detail. UI in English.

const SessionEnded = ({ duration, turns, onDiagnostic, onTranscript, onAgain, onHome }) => (
  <PageFrame>
    <TopBar onHome={onHome} minimal />
    <main className="px-10 max-w-[760px] mx-auto pt-16 pb-24">
      <MetaLabel>Session complete · April 27</MetaLabel>
      <h1 className="font-display text-[64px] leading-[0.98] tracking-[-0.025em] text-ink mt-6 mb-12 max-w-[16ch]">
        That was a good conversation.
      </h1>

      <div className="grid grid-cols-3 gap-6 border-t border-b border-rule py-8 mb-12">
        <div>
          <MetaLabel>Duration</MetaLabel>
          <div className="font-display text-[40px] tracking-[-0.02em] text-ink mt-2 tabular">
            {duration}<span className="text-[20px] text-mute ml-1">min</span>
          </div>
        </div>
        <div>
          <MetaLabel>Turns</MetaLabel>
          <div className="font-display text-[40px] tracking-[-0.02em] text-ink mt-2 tabular">{turns}</div>
        </div>
        <div>
          <MetaLabel>Frame</MetaLabel>
          <div className="font-display-sm text-[20px] text-ink mt-3">Ordering at a café</div>
        </div>
      </div>

      <p className="font-display-sm text-[17px] leading-[1.6] text-ink2 mb-12 max-w-[48ch]">
        The diagnostic is optional. Run it if you want to see where you tripped — otherwise keep the momentum and come back later.
      </p>

      <div className="flex flex-wrap items-center gap-5">
        <PrimaryButton onClick={onDiagnostic} className="px-8 py-4 text-[15px]" autoFocus>
          Run the diagnostic
          <IconArrow size={15} />
        </PrimaryButton>
        <GhostButton onClick={onTranscript} className="px-8 py-4 text-[15px]">View transcript</GhostButton>
        <span className="text-mute2">·</span>
        <TextLink onClick={onAgain}>Another session</TextLink>
      </div>
    </main>
  </PageFrame>
);

const DiagnosticRunning = ({ onCancel, onDone }) => {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  React.useEffect(() => {
    const id = setTimeout(onDone, 6000);
    return () => clearTimeout(id);
  }, [onDone]);

  const stages = [
    { label: 'Aligning transcript', done: seconds >= 1 },
    { label: 'Analysing phonemes',  done: seconds >= 3 },
    { label: 'Checking grammar',    done: seconds >= 4 },
    { label: 'Extracting vocabulary', done: seconds >= 5 },
  ];

  return (
    <PageFrame>
      <TopBar minimal right={<TextLink onClick={onCancel}>I'll come back later</TextLink>} />
      <main className="px-10 max-w-[640px] mx-auto pt-20 pb-24">
        <MetaLabel>Diagnostic in progress</MetaLabel>
        <h1 className="font-display text-[48px] leading-[1] tracking-[-0.02em] text-ink mt-5 mb-3">
          Camille is re-reading the conversation.
        </h1>
        <p className="font-display-sm text-[16px] leading-[1.6] text-ink2 mb-14 max-w-[44ch]">
          Takes about a minute. You can close this tab — the result will be waiting in your history.
        </p>

        <div className="space-y-4 mb-14">
          {stages.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-4 h-4 flex items-center justify-center">
                {s.done ? <IconCheck size={14} className="text-wine" /> : <span className="w-1.5 h-1.5 rounded-full bg-mute2 breath" />}
              </div>
              <span className={'font-display-sm text-[17px] ' + (s.done ? 'text-ink' : 'text-mute')}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-baseline gap-3 text-mute">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Elapsed</span>
          <span className="font-mono text-[12px] tabular">{fmtTime(seconds)}</span>
          <span className="text-mute2">·</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Estimate</span>
          <span className="font-mono text-[12px] tabular">~ 1:00</span>
        </div>
      </main>
    </PageFrame>
  );
};

const AnnotatedSentence = ({ turn, onHover, hoveredKey, idx }) => {
  if (!turn.grammarIssues || turn.grammarIssues.length === 0) return <span>{turn.text}</span>;
  const out = [];
  let cursor = 0;
  turn.grammarIssues.forEach((g, gi) => {
    if (g.from > cursor) out.push(<span key={`p${gi}`}>{turn.text.slice(cursor, g.from)}</span>);
    const key = `${idx}-${gi}`;
    out.push(
      <span key={`g${gi}`}
        onMouseEnter={() => onHover(key)} onMouseLeave={() => onHover(null)}
        className="relative cursor-help"
        style={{
          background: hoveredKey === key ? 'rgba(107,39,55,0.10)' : 'rgba(107,39,55,0.04)',
          boxShadow: 'inset 0 -2px 0 rgba(107,39,55,0.45)', padding: '0 1px', transition: 'background 200ms ease',
        }}>
        {turn.text.slice(g.from, g.to)}
      </span>
    );
    cursor = g.to;
  });
  if (cursor < turn.text.length) out.push(<span key="rest">{turn.text.slice(cursor)}</span>);
  return <React.Fragment>{out}</React.Fragment>;
};

const DiagnosticResults = ({ onBack, onHome }) => {
  const [tab, setTab] = React.useState('pron');
  const [hoveredKey, setHoveredKey] = React.useState(null);

  return (
    <div className="min-h-screen diagnostic-mode page-enter">
      <TopBar onHome={onHome}
        right={<React.Fragment><MetaLabel>Diagnostic mode</MetaLabel><TextLink onClick={onBack}>Back</TextLink></React.Fragment>} />
      <main className="px-10 max-w-[1200px] mx-auto pt-4 pb-24">
        <div className="grid grid-cols-12 gap-8 border-b border-rule2 pb-8 mb-10">
          <div className="col-span-7">
            <MetaLabel>Diagnostic · April 27 · Ordering at a café</MetaLabel>
            <h1 className="font-display text-[44px] leading-[1] tracking-[-0.02em] text-ink mt-4">
              Three things to revisit; the rest holds up.
            </h1>
          </div>
          <div className="col-span-5 grid grid-cols-3 gap-6 items-end">
            <div>
              <MetaLabel>Pronunciation</MetaLabel>
              <div className="font-display text-[36px] tracking-[-0.02em] text-ink tabular mt-1">
                81<span className="text-[18px] text-mute">/100</span>
              </div>
            </div>
            <div>
              <MetaLabel>Grammar</MetaLabel>
              <div className="font-display text-[36px] tracking-[-0.02em] text-ink tabular mt-1">
                2<span className="text-[18px] text-mute"> errors</span>
              </div>
            </div>
            <div>
              <MetaLabel>Vocabulary</MetaLabel>
              <div className="font-display text-[36px] tracking-[-0.02em] text-ink tabular mt-1">
                47<span className="text-[18px] text-mute"> words</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8 border-b border-rule2 mb-10">
          {[
            { id: 'pron', label: 'Pronunciation', n: '01' },
            { id: 'gram', label: 'Grammar',       n: '02' },
            { id: 'voc',  label: 'Vocabulary',    n: '03' },
          ].map((x) => (
            <button key={x.id} onClick={() => setTab(x.id)}
              className={'pb-4 -mb-px border-b-2 transition-colors flex items-baseline gap-3 ' +
                (tab === x.id ? 'border-ink text-ink' : 'border-transparent text-mute hover:text-ink2')}>
              <span className={'font-mono text-[10px] tracking-[0.18em] ' + (tab === x.id ? 'text-wine' : 'text-mute2')}>{x.n}</span>
              <span className="font-display-sm text-[18px] tracking-[-0.005em]">{x.label}</span>
            </button>
          ))}
        </div>

        {tab === 'pron' && <PronunciationPanel />}
        {tab === 'gram' && <GrammarPanel hoveredKey={hoveredKey} setHoveredKey={setHoveredKey} />}
        {tab === 'voc'  && <VocabPanel />}
      </main>
    </div>
  );
};

const PronunciationPanel = () => (
  <div className="grid grid-cols-12 gap-12">
    <div className="col-span-7">
      <MetaLabel>Points to revisit</MetaLabel>
      <ul className="mt-6 divide-y divide-rule2">
        {PRONUNCIATION_ISSUES.map((p, i) => (
          <li key={i} className="py-7 grid grid-cols-12 gap-6">
            <div className="col-span-1 pt-1">
              <span className="font-mono text-[10px] tracking-[0.18em] text-mute2">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="col-span-7">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-[28px] tracking-[-0.01em] text-ink italic">{p.word}</span>
                <span className="font-mono text-[13px] text-wine">{p.phoneme}</span>
              </div>
              <p className="text-[14px] leading-[1.65] text-ink2 mt-2 max-w-[44ch]">{p.note}</p>
            </div>
            <div className="col-span-4 flex flex-col items-end justify-start">
              <div className="font-display text-[44px] tracking-[-0.02em] text-ink tabular leading-none">
                {p.score}<span className="text-[18px] text-mute">/100</span>
              </div>
              <div className="w-full h-px bg-rule2 mt-3 relative">
                <div className="absolute inset-y-0 left-0 bg-wine" style={{ width: `${p.score}%`, height: '2px', top: '-0.5px' }} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-mute hover:text-ink cursor-pointer">
                <IconPlay size={11} />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Replay</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
    <div className="col-span-5">
      <MetaLabel>Annotated transcript</MetaLabel>
      <div className="mt-6 space-y-5 border-l border-rule2 pl-6">
        {SAMPLE_TRANSCRIPT.map((turn, i) => {
          const flagged = PRONUNCIATION_ISSUES.find((p) => p.turnIndex === i);
          return (
            <div key={i} className="text-[14px] leading-[1.65]">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute2 mr-3">
                {turn.who === 'ai' ? 'C.' : 'You'}
              </span>
              <span className={turn.who === 'user' ? 'text-ink' : 'text-mute'}>
                {flagged ? (
                  <React.Fragment>
                    {turn.text.split(flagged.word)[0]}
                    <span style={{ background: 'rgba(107,39,55,0.10)', boxShadow: 'inset 0 -2px 0 rgba(107,39,55,0.55)', padding: '0 1px' }}>
                      {flagged.word}
                    </span>
                    {turn.text.split(flagged.word)[1]}
                  </React.Fragment>
                ) : turn.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const GrammarPanel = ({ hoveredKey, setHoveredKey }) => {
  const allIssues = [];
  SAMPLE_TRANSCRIPT.forEach((t, i) => {
    if (t.grammarIssues) t.grammarIssues.forEach((g, gi) => allIssues.push({ ...g, turnIdx: i, key: `${i}-${gi}` }));
  });
  const active = allIssues.find((a) => a.key === hoveredKey) || allIssues[0];

  return (
    <div className="grid grid-cols-12 gap-12">
      <div className="col-span-8">
        <MetaLabel>Transcript</MetaLabel>
        <div className="mt-6 space-y-5">
          {SAMPLE_TRANSCRIPT.map((turn, i) => (
            <div key={i} className="grid grid-cols-12 gap-4">
              <div className="col-span-1 pt-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute2">
                  {turn.who === 'ai' ? 'C.' : 'You'}
                </span>
              </div>
              <div className="col-span-11">
                <p className={'font-display-sm text-[18px] leading-[1.65] ' + (turn.who === 'ai' ? 'text-mute' : 'text-ink')}>
                  <AnnotatedSentence turn={turn} idx={i} onHover={setHoveredKey} hoveredKey={hoveredKey} />
                </p>
                <p className="text-[12px] text-mute2 mt-1 italic">{turn.gloss}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="col-span-4">
        <MetaLabel>Margin note</MetaLabel>
        {active ? (
          <div className="mt-6 border-t border-ink pt-5">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="font-display text-[20px] italic text-mute line-through">{active.original}</span>
              <IconArrow size={12} className="text-wine self-center" />
              <span className="font-display text-[22px] text-ink">{active.correction}</span>
            </div>
            <p className="text-[14px] leading-[1.7] text-ink2 max-w-[36ch]">{active.note}</p>
            <div className="mt-6 text-[12px] text-mute italic">
              Hover any underlined passage in the transcript to walk through them one by one.
            </div>
          </div>
        ) : null}

        <div className="mt-12">
          <MetaLabel>Summary</MetaLabel>
          <ul className="mt-4 space-y-3">
            {allIssues.map((a) => (
              <li key={a.key}
                onMouseEnter={() => setHoveredKey(a.key)} onMouseLeave={() => setHoveredKey(null)}
                className={'text-[14px] leading-[1.5] cursor-pointer pl-3 border-l-2 transition-colors ' +
                  (hoveredKey === a.key ? 'border-wine text-ink' : 'border-rule2 text-ink2')}>
                <span className="line-through text-mute">{a.original}</span>{' '}
                <span className="text-mute2">→</span>{' '}
                <span>{a.correction}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
};

const VocabPanel = () => (
  <div className="grid grid-cols-12 gap-12">
    <div className="col-span-6">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="font-display-sm text-[22px] tracking-[-0.005em] text-ink">Comfortable</h3>
        <MetaLabel>{VOCAB.comfortable.length} words</MetaLabel>
      </div>
      <ul className="divide-y divide-rule2">
        {VOCAB.comfortable.map((v, i) => (
          <li key={i} className="py-3 grid grid-cols-12 gap-4 items-baseline">
            <span className="col-span-1 font-mono text-[10px] text-mute2 tabular">{String(i + 1).padStart(2, '0')}</span>
            <span className="col-span-5 font-display-sm text-[18px] text-ink italic">{v.fr}</span>
            <span className="col-span-6 text-[13px] text-mute">{v.en}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="col-span-6">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="font-display-sm text-[22px] tracking-[-0.005em] text-ink">To revisit</h3>
        <MetaLabel>{VOCAB.stumbled.length} words</MetaLabel>
      </div>
      <ul className="divide-y divide-rule2">
        {VOCAB.stumbled.map((v, i) => (
          <li key={i} className="py-3 grid grid-cols-12 gap-4 items-baseline">
            <span className="col-span-1 font-mono text-[10px] text-wine tabular">{String(i + 1).padStart(2, '0')}</span>
            <span className="col-span-4 font-display-sm text-[18px] text-ink italic">{v.fr}</span>
            <span className="col-span-3 text-[13px] text-ink2">{v.en}</span>
            <span className="col-span-4 text-[12px] text-mute italic">{v.note}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const SessionDetail = ({ session, onBack, onDiagnostic, onOpenDiag }) => {
  const t = useTicker(120);
  const playPos = (Math.sin(t * 0.04) * 0.5 + 0.5) * 0.6 + 0.1;
  return (
    <PageFrame>
      <TopBar right={<TextLink onClick={onBack}>Back</TextLink>} />
      <main className="px-10 max-w-[960px] mx-auto pt-6 pb-24">
        <MetaLabel>{session.dateLong}</MetaLabel>
        <h1 className="font-display text-[56px] leading-[0.98] tracking-[-0.025em] text-ink mt-4 mb-3">
          {session.scenario}
        </h1>
        <p className="font-display-sm text-[16px] text-mute mb-10">{session.duration} · {session.turns} turns</p>

        <div className="border-t border-b border-rule py-6 mb-12">
          <div className="flex items-center gap-5">
            <button className="text-ink hover:text-wine transition-colors"><IconPlay size={18} /></button>
            <span className="font-mono text-[11px] tabular text-mute">{fmtTime(Math.floor(playPos * session.durationMin * 60))}</span>
            <div className="flex-1 h-[18px] flex items-center relative">
              <div className="absolute inset-0 flex items-center gap-[2px]">
                {Array.from({ length: 96 }).map((_, i) => {
                  const v = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.41));
                  const past = i / 96 < playPos;
                  return <span key={i} className="flex-1" style={{ height: `${v * 100}%`, background: past ? '#1A1816' : '#D7CDB9' }} />;
                })}
              </div>
            </div>
            <span className="font-mono text-[11px] tabular text-mute">{session.duration}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-8">
            <MetaLabel>Transcript</MetaLabel>
            <div className="mt-5 space-y-5">
              {SAMPLE_TRANSCRIPT.map((turn, i) => (
                <div key={i} className="grid grid-cols-12 gap-4">
                  <div className="col-span-1 pt-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute2">
                      {turn.who === 'ai' ? 'C.' : 'You'}
                    </span>
                  </div>
                  <div className="col-span-11">
                    <p className={'font-display-sm text-[18px] leading-[1.65] ' + (turn.who === 'ai' ? 'text-mute' : 'text-ink')}>
                      {turn.text}
                    </p>
                    <p className="text-[12px] text-mute2 mt-1 italic">{turn.gloss}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="col-span-4">
            <MetaLabel>Diagnostic</MetaLabel>
            {session.diagnostic === 'run' ? (
              <div className="mt-5">
                <p className="font-display-sm text-[16px] leading-[1.6] text-ink2 mb-5">
                  Full analysis available. Three points to revisit, two grammar corrections.
                </p>
                <PrimaryButton onClick={onOpenDiag}>Open the diagnostic<IconArrow size={14} /></PrimaryButton>
              </div>
            ) : (
              <div className="mt-5">
                <p className="font-display-sm text-[16px] leading-[1.6] text-ink2 mb-5">
                  Not run yet. You can run it now — about a minute.
                </p>
                <PrimaryButton onClick={onDiagnostic}>Run the diagnostic<IconArrow size={14} /></PrimaryButton>
              </div>
            )}
          </aside>
        </div>
      </main>
    </PageFrame>
  );
};

Object.assign(window, { SessionEnded, DiagnosticRunning, DiagnosticResults, SessionDetail });
