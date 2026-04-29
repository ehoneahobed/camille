// Live session — full video-call layout with RPM 3D avatar, captions, and your webcam tile.

const SESSION_SCRIPT = [
  { who: 'ai',   text: "Bonjour, bienvenue. Qu'est-ce que je vous sers ce matin ?", gloss: "Hello, welcome. What can I get you this morning?", assist: "« Qu'est-ce que je vous sers » is the standard café phrase.", dur: 4400 },
  { who: 'user', text: "Bonjour. Je voudrais un café allongé, s'il vous plaît.", gloss: "Hello. I'd like a long coffee, please.", dur: 3800 },
  { who: 'ai',   text: "Très bien. Avec ça, je vous propose une viennoiserie ?", gloss: "Very good. Can I offer you a pastry with that?", assist: "“Viennoiserie” covers croissants, pains au chocolat, brioches.", dur: 4000 },
  { who: 'user', text: "Oui, je vais prendre un croissant. Il est encore chaud ?", gloss: "Yes, I'll have a croissant. Is it still warm?", dur: 3900 },
  { who: 'user', kind: 'help-request', text: "Sorry, what does “à emporter” mean?", dur: 2600 },
  { who: 'ai',   kind: 'translation', text: "“À emporter” means “to take away” — opposite of « sur place », which is eating in.", dur: 4400 },
  { who: 'ai',   text: "Il vient de sortir du four. Sur place ou à emporter ?", gloss: "It just came out of the oven. Eating in or taking away?", dur: 4200 },
  { who: 'user', text: "Sur place, merci. Je peux m'asseoir près de la fenêtre ?", gloss: "Eating in, thanks. Can I sit by the window?", dur: 3700 },
];

const FrenchLine = ({ text, gloss, assist, mode = 'hover' }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-block align-baseline">
      <span
        onMouseEnter={() => mode === 'hover' && setOpen(true)}
        onMouseLeave={() => mode === 'hover' && setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="cursor-help"
        style={{
          backgroundImage: 'linear-gradient(rgba(194,65,12,0.45), rgba(194,65,12,0.45))',
          backgroundSize: '100% 1px', backgroundPosition: '0 100%', backgroundRepeat: 'no-repeat',
          paddingBottom: '2px',
        }}
      >{text}</span>
      {open && gloss && (
        <span className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 w-max max-w-[360px] bg-canvas3 border border-rule2 text-ink px-3 py-2 text-[12px] leading-[1.5] font-sans not-italic"
              style={{ top: '100%' }}>
          <span className="block text-mute font-mono uppercase tracking-[0.18em] text-[9px] mb-1">English</span>
          {gloss}
          {assist && <span className="block text-ink2 mt-1.5 italic">{assist}</span>}
        </span>
      )}
    </span>
  );
};

const LiveSession = ({ scenarioId, onEnd }) => {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[1];
  const [turnIdx, setTurnIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [scaffold, setScaffold] = React.useState('hover');
  const [gender, setGender] = React.useState('female');
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

  React.useEffect(() => {
    if (paused) return;
    const turn = SESSION_SCRIPT[turnIdx % SESSION_SCRIPT.length];
    const start = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / turn.dur);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else { setTurnIdx((i) => i + 1); setProgress(0); }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [turnIdx, paused]);

  const currentTurn = SESSION_SCRIPT[turnIdx % SESSION_SCRIPT.length];
  const history = [];
  for (let i = 0; i < turnIdx; i++) history.push(SESSION_SCRIPT[i % SESSION_SCRIPT.length]);

  let avatarState = 'idle';
  if (paused) avatarState = 'idle';
  else if (currentTurn.who === 'ai') avatarState = progress < 0.08 ? 'thinking' : 'speaking';
  else avatarState = 'listening';

  const liveText = currentTurn.who === 'user'
    ? currentTurn.text.slice(0, Math.floor(currentTurn.text.length * progress))
    : currentTurn.text;

  const aiSpeaking = currentTurn.who === 'ai' && !paused;

  return (
    <div className="min-h-screen bg-canvas page-enter flex flex-col relative overflow-hidden">
      {/* Cinematic vignette */}
      <div className="absolute inset-0 vc-vignette pointer-events-none z-0" />

      {/* Top bar */}
      <div className="px-8 pt-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <span className="w-1.5 h-1.5 rounded-full bg-wine breath" />
          <MetaLabel className="text-ink2">Live · {scenario.en}</MetaLabel>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1 border border-rule2 px-1 py-0.5 bg-canvas2/60">
            {[
              { id: 'always', label: 'Show EN' },
              { id: 'hover',  label: 'On hover' },
              { id: 'off',    label: 'No gloss' },
            ].map((m) => (
              <button key={m.id} onClick={() => setScaffold(m.id)}
                className={'text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-1 transition-colors ' +
                  (scaffold === m.id ? 'bg-wine text-canvas' : 'text-mute hover:text-ink')}>
                {m.label}
              </button>
            ))}
          </div>
          <span className="font-mono text-[11px] tracking-[0.16em] text-mute tabular">{fmtTime(elapsed)}</span>
          <button onClick={() => setPaused((p) => !p)} className="text-mute hover:text-ink transition-colors">
            {paused ? <IconPlay size={14} /> : <IconPause size={14} />}
          </button>
          <button onClick={onEnd}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-wine2 hover:text-ink transition-colors">
            End call
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Avatar tile — large, centered */}
        <div className={'relative bg-canvas2 border border-rule2 ' + (aiSpeaking ? 'speaker-glow' : '')}
             style={{ width: 520, height: 520 }}>
          <RPMAvatar gender={gender} state={avatarState} size={520} />
          {/* Name plate */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="px-2 py-1 bg-canvas/80 backdrop-blur text-ink text-[12px] font-medium tracking-[0.01em]">
              {gender === 'female' ? 'Camille' : 'Léo'}
            </span>
            {aiSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-wine breath" />}
          </div>
          {/* Gender toggle */}
          <div className="absolute top-3 right-3 flex items-center gap-1 border border-rule2 bg-canvas/70 backdrop-blur px-1 py-0.5">
            {['female','male'].map((g) => (
              <button key={g} onClick={() => setGender(g)}
                className={'text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-1 transition-colors ' +
                  (gender === g ? 'bg-wine text-canvas' : 'text-mute hover:text-ink')}>
                {g === 'female' ? 'Camille' : 'Léo'}
              </button>
            ))}
          </div>
        </div>

        {/* Captions strip */}
        <div className="mt-8 max-w-[820px] text-center min-h-[100px] px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] mb-3 inline-block"
                style={{ color: currentTurn.who === 'user' ? '#EA580C' : '#8A8576' }}>
            {currentTurn.kind === 'translation' ? 'Camille · translating'
              : currentTurn.kind === 'help-request' ? 'You · asking'
              : currentTurn.who === 'ai' ? (gender === 'female' ? 'Camille' : 'Léo')
              : 'You'}
          </span>
          {currentTurn.kind === 'translation' || currentTurn.kind === 'help-request' ? (
            <p className="font-display text-[26px] leading-[1.35] tracking-[-0.01em] text-ink2">
              {liveText || currentTurn.text}
              {currentTurn.who === 'user' && progress < 1 && (
                <span className="caret inline-block w-[2px] h-[0.85em] bg-wine align-baseline ml-1" />
              )}
            </p>
          ) : currentTurn.who === 'ai' ? (
            <React.Fragment>
              <p className="font-display text-[28px] leading-[1.3] tracking-[-0.01em] text-ink">
                <FrenchLine text={currentTurn.text} gloss={currentTurn.gloss} assist={currentTurn.assist}
                  mode={scaffold === 'off' ? 'click' : 'hover'} />
              </p>
              {scaffold === 'always' && currentTurn.gloss && (
                <p className="mt-2 text-[14px] text-mute italic">{currentTurn.gloss}</p>
              )}
            </React.Fragment>
          ) : (
            <p className="font-display text-[28px] leading-[1.3] tracking-[-0.01em] text-ink">
              {liveText}
              {progress < 1 && <span className="caret inline-block w-[2px] h-[0.85em] bg-wine align-baseline ml-1" />}
            </p>
          )}
        </div>
      </div>

      {/* Your webcam tile — top right, below top bar */}
      <div className="absolute top-20 right-8 w-[180px] h-[124px] border border-rule2 bg-canvas2 z-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-canvas3 to-canvas flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-wine/30 flex items-center justify-center">
            <span className="font-display text-[24px] text-ink">É</span>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 text-[11px] text-ink font-medium bg-canvas/70 px-2 py-0.5 backdrop-blur">
          You
        </div>
        {currentTurn.who === 'user' && !paused && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-wine2 breath" />
        )}
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-rule bg-canvas2/80 backdrop-blur z-10">
        <div className="px-10 py-4 max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setShowHelp((h) => !h)}
              className={'text-[12px] font-mono uppercase tracking-[0.16em] px-3 py-2 border transition-colors ' +
                (showHelp ? 'border-wine bg-wine text-canvas' : 'border-rule2 text-ink2 hover:bg-canvas3')}>
              ? &nbsp; What did she just say?
            </button>
            <button className="text-[12px] font-mono uppercase tracking-[0.16em] px-3 py-2 border border-rule2 text-ink2 hover:bg-canvas3">
              How do I say…?
            </button>
            <button className="text-[12px] font-mono uppercase tracking-[0.16em] px-3 py-2 border border-rule2 text-ink2 hover:bg-canvas3">
              Slow down
            </button>
            <button className="text-[12px] font-mono uppercase tracking-[0.16em] px-3 py-2 border border-rule2 text-ink2 hover:bg-canvas3">
              Repeat
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-canvas3 hover:bg-wine text-ink flex items-center justify-center transition-colors">
              <IconMic size={16} />
            </button>
            <button onClick={onEnd}
              className="px-4 h-10 bg-wine2 text-canvas text-[12px] font-medium tracking-[0.01em] hover:bg-wine transition-colors">
              End call
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="border-t border-rule px-10 py-5 max-w-[1280px] mx-auto bg-canvas3">
            <MetaLabel>Last line, in English</MetaLabel>
            <p className="font-display-sm text-[18px] text-ink mt-2 mb-1">
              {currentTurn.gloss || (history[history.length - 1] && history[history.length - 1].gloss) || '—'}
            </p>
            {currentTurn.assist && <p className="text-[13px] text-mute italic">{currentTurn.assist}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { LiveSession, FrenchLine });
