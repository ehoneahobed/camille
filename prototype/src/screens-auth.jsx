// Sign-in and magic link screens. UI in English.

const SignInScreen = ({ onSent, onBackToLanding }) => {
  const [email, setEmail] = React.useState('');
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const submit = (e) => { e.preventDefault(); if (valid) onSent(email); };

  return (
    <PageFrame className="flex flex-col">
      <TopBar onHome={onBackToLanding} minimal />
      <div className="flex-1 flex items-center justify-center px-8 -mt-16">
        <div className="w-full max-w-[420px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute mb-10">
            № 01 &nbsp;·&nbsp; Sign in
          </p>
          <h1 className="font-display text-[64px] leading-[0.95] tracking-[-0.02em] text-ink mb-6">
            Welcome back.
          </h1>
          <p className="font-display-sm text-[18px] leading-[1.55] text-ink2 mb-12 max-w-[36ch]">
            Thirty minutes of French a day, no badges, no hollow encouragement. We pick up where you left off.
          </p>
          <form onSubmit={submit}>
            <label className="block">
              <MetaLabel>Email address</MetaLabel>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" autoFocus
                className="mt-3 w-full bg-transparent border-0 border-b border-rule2 pb-3 text-[20px] font-display-sm text-ink placeholder:text-mute2 focus:border-ink focus:outline-none transition-colors" />
            </label>
            <div className="mt-10 flex items-center justify-between">
              <PrimaryButton type="submit" disabled={!valid}>
                Send the link
                <IconArrow size={14} />
              </PrimaryButton>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">No password</span>
            </div>
          </form>
          <Rule className="my-10" />
          <p className="text-[13px] text-mute">
            New here?{' '}
            <button onClick={onBackToLanding} className="text-ink editorial-link hover:text-wine">
              Read about the method
            </button>.
          </p>
        </div>
      </div>
      <footer className="px-10 pb-8 flex items-baseline justify-between">
        <MetaLabel>Paris · Brooklyn · Lisboa</MetaLabel>
        <MetaLabel>v0.4 — Apr 2026</MetaLabel>
      </footer>
    </PageFrame>
  );
};

const MagicLinkSent = ({ email, onResend, onBack, onSimulate }) => {
  const [seconds, setSeconds] = React.useState(30);
  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return (
    <PageFrame className="flex flex-col">
      <TopBar minimal />
      <div className="flex-1 flex items-center justify-center px-8 -mt-16">
        <div className="w-full max-w-[460px]">
          <MetaLabel>Link sent</MetaLabel>
          <h1 className="font-display text-[48px] leading-[1] tracking-[-0.02em] text-ink mt-4 mb-6">
            Check your inbox.
          </h1>
          <p className="font-display-sm text-[17px] leading-[1.6] text-ink2 mb-2">
            We sent a link to&nbsp;
            <span className="text-ink border-b border-ink/40">{email}</span>.
          </p>
          <p className="text-[14px] leading-[1.7] text-mute mb-12 max-w-[44ch]">
            The link expires in ten minutes. If you don't see it, check spam before requesting another.
          </p>
          <div className="flex items-center gap-6">
            {seconds > 0 ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
                Resend in {seconds.toString().padStart(2, '0')}s
              </span>
            ) : (
              <TextLink onClick={() => { onResend(); setSeconds(30); }}>Resend the link</TextLink>
            )}
            <span className="text-mute2">·</span>
            <TextLink onClick={onBack}>Use a different email</TextLink>
          </div>
          <Rule className="my-12" />
          <p className="text-[12px] leading-[1.6] text-mute mb-3">
            <MetaLabel>Demo</MetaLabel>
          </p>
          <GhostButton onClick={onSimulate}>
            Simulate sign-in
            <IconArrow size={14} />
          </GhostButton>
        </div>
      </div>
      <footer className="px-10 pb-8" />
    </PageFrame>
  );
};

Object.assign(window, { SignInScreen, MagicLinkSent });
