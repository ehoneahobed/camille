// Top-level app — handles navigation between screens.
const App = () => {
  const [screen, setScreen] = React.useState('landing');
  const [email, setEmail] = React.useState('');
  const [scenarioId, setScenarioId] = React.useState('cafe');
  const [openSessionId, setOpenSessionId] = React.useState(null);

  const go = (s) => setScreen(s);

  // Map AppNav top-level ids to screen ids.
  const onNav = (id) => {
    if (id === 'home') go('home');
    else if (id === 'scenarios') go('library');
    else if (id === 'progress') go('progress');
    else if (id === 'history') go('history');
    else if (id === 'settings') go('settings');
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (screen === 'live') go('ended');
        else if (['scenario','presession','detail','diag','diagrunning'].includes(screen)) go('home');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  const openSession = PAST_SESSIONS.find((s) => s.id === openSessionId) || PAST_SESSIONS[0];
  const onSignOut = () => go('landing');

  return (
    <React.Fragment>
      {screen === 'landing'  && <LandingScreen onSignIn={() => go('signin')} onStart={() => go('signin')} />}
      {screen === 'signin'   && <SignInScreen onSent={(e) => { setEmail(e); go('sent'); }} onBackToLanding={() => go('landing')} />}
      {screen === 'sent'     && <MagicLinkSent email={email} onResend={() => {}} onBack={() => go('signin')} onSimulate={() => go('home')} />}

      {screen === 'home'     && <HomeScreen weekMinutes={172} sessions={PAST_SESSIONS}
                                  onStart={() => go('scenario')}
                                  onOpenSession={(id) => { setOpenSessionId(id); go('detail'); }}
                                  onNav={onNav} onSignOut={onSignOut} />}
      {screen === 'library'  && <ScenarioLibrary onNav={onNav}
                                  onStartWith={(id) => { setScenarioId(id); go('presession'); }}
                                  onSignOut={onSignOut} />}
      {screen === 'history'  && <HistoryScreen onNav={onNav}
                                  onOpenSession={(id) => { setOpenSessionId(id); go('detail'); }}
                                  onSignOut={onSignOut} />}
      {screen === 'progress' && <ProgressScreen onNav={onNav} onSignOut={onSignOut} />}
      {screen === 'settings' && <SettingsScreen onNav={onNav} onSignOut={onSignOut} />}

      {screen === 'scenario'   && <ScenarioPicker onCancel={() => go('home')} onStart={(id) => { setScenarioId(id); go('presession'); }} />}
      {screen === 'presession' && <PreSessionCheck scenarioId={scenarioId} onCancel={() => go('scenario')} onBegin={() => go('live')} />}
      {screen === 'live'       && <LiveSession scenarioId={scenarioId} onEnd={() => go('ended')} />}
      {screen === 'ended'      && <SessionEnded duration={38} turns={42}
                                    onDiagnostic={() => go('diagrunning')}
                                    onTranscript={() => { setOpenSessionId('s5'); go('detail'); }}
                                    onAgain={() => go('scenario')} onHome={() => go('home')} />}
      {screen === 'diagrunning' && <DiagnosticRunning onCancel={() => go('home')} onDone={() => go('diag')} />}
      {screen === 'diag'        && <DiagnosticResults onBack={() => go('home')} onHome={() => go('home')} />}
      {screen === 'detail'      && <SessionDetail session={openSession} onBack={() => go('home')}
                                    onDiagnostic={() => go('diagrunning')} onOpenDiag={() => go('diag')} />}
    </React.Fragment>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
