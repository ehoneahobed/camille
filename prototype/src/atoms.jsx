// Reusable atoms shared across screens. UI in English.

const PrimaryButton = ({ children, onClick, className = '', type = 'button', disabled = false, autoFocus = false }) => (
  <button type={type} onClick={onClick} disabled={disabled} autoFocus={autoFocus}
    className={'inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink text-canvas text-[14px] font-medium tracking-[0.01em] hover:bg-ink2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ' + className}>
    {children}
  </button>
);

const GhostButton = ({ children, onClick, className = '', type = 'button' }) => (
  <button type={type} onClick={onClick}
    className={'inline-flex items-center justify-center gap-2 px-6 py-3 border border-rule2 text-ink text-[14px] font-medium tracking-[0.01em] hover:bg-canvas2 transition-colors ' + className}>
    {children}
  </button>
);

const TextLink = ({ children, onClick, className = '' }) => (
  <button onClick={onClick}
    className={'text-mute hover:text-ink text-[13px] tracking-[0.01em] editorial-link transition-colors ' + className}>
    {children}
  </button>
);

const MetaLabel = ({ children, className = '' }) => (
  <span className={'font-mono text-[10px] uppercase tracking-[0.18em] text-mute ' + className}>{children}</span>
);

const PageFrame = ({ children, className = '' }) => (
  <div className={'min-h-screen bg-canvas page-enter ' + className}>{children}</div>
);

// App-shell top bar with internal nav (used post-auth).
const AppNav = ({ current, onNav, onSignOut }) => {
  const items = [
    { id: 'home', label: 'Home' },
    { id: 'scenarios', label: 'Scenarios' },
    { id: 'progress', label: 'Progress' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];
  return (
    <header className="px-10 pt-8 pb-6 flex items-baseline justify-between">
      <button onClick={() => onNav('home')}
        className="font-display-sm text-[20px] tracking-[-0.01em] text-ink hover:text-wine transition-colors">
        Camille<span className="text-wine">.</span>
      </button>
      <nav className="flex items-center gap-7">
        {items.map((it) => (
          <button key={it.id} onClick={() => onNav(it.id)}
            className={'text-[13px] tracking-[0.01em] transition-colors ' + (current === it.id ? 'text-ink' : 'text-mute hover:text-ink')}>
            {it.label}
            {current === it.id && <span className="block h-px bg-wine mt-1" />}
          </button>
        ))}
        <span className="text-rule2">·</span>
        <button onClick={onSignOut} className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute hover:text-wine transition-colors">
          Sign out
        </button>
      </nav>
    </header>
  );
};

// Minimal top bar (auth/landing).
const TopBar = ({ onHome, right = null, minimal = false }) => (
  <header className="px-10 pt-8 pb-6 flex items-baseline justify-between">
    <button onClick={onHome}
      className="font-display-sm text-[20px] tracking-[-0.01em] text-ink hover:text-wine transition-colors"
      aria-label="Home">
      Camille<span className="text-wine">.</span>
    </button>
    {!minimal && <div className="flex items-center gap-6">{right}</div>}
  </header>
);

const Rule = ({ className = '' }) => <div className={'h-px bg-rule ' + className} />;

const useTicker = (intervalMs = 50) => {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return t;
};

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
};

Object.assign(window, { PrimaryButton, GhostButton, TextLink, MetaLabel, PageFrame, TopBar, AppNav, Rule, useTicker, fmtTime });
