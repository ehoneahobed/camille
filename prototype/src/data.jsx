// Mock data. UI labels are in English; French only appears as learning content.
const SCENARIOS = [
  {
    id: 'freestyle',
    fr: 'Conversation libre',
    en: 'Freestyle',
    desc: "No frame. You pick the topic, the pace, and the register.",
    level: 'A2 — C1',
    topics: ['Open-ended', 'Any register'],
  },
  {
    id: 'cafe',
    fr: 'Au café',
    en: 'Ordering at a café',
    desc: "Order, ask for the menu, pay. Everyday vocabulary, informal register.",
    level: 'A2',
    topics: ['Food & drink', 'Polite forms'],
  },
  {
    id: 'chemin',
    fr: 'Demander son chemin',
    en: 'Asking for directions',
    desc: "Landmarks, prepositions of place, polite forms with a stranger.",
    level: 'A2',
    topics: ['Navigation', 'Strangers'],
  },
  {
    id: 'small',
    fr: 'Petite conversation',
    en: 'Casual small talk',
    desc: "Weather, weekend, films. Maintain fluency without high stakes.",
    level: 'B1',
    topics: ['Daily life', 'Light'],
  },
  {
    id: 'work',
    fr: 'Réunion de travail',
    en: 'Work meeting',
    desc: "Professional register, agreement and disagreement, agenda items.",
    level: 'B2',
    topics: ['Professional', 'Formal'],
  },
  {
    id: 'news',
    fr: "Discuter l'actualité",
    en: 'Discussing current events',
    desc: "Argue, qualify, express doubt. Vocabulary from the press.",
    level: 'B2 — C1',
    topics: ['Opinions', 'Press'],
  },
  {
    id: 'doctor',
    fr: 'Chez le médecin',
    en: 'At the doctor',
    desc: "Describe symptoms, understand instructions, ask follow-up questions.",
    level: 'B1',
    topics: ['Health', 'Specialised vocab'],
  },
  {
    id: 'rental',
    fr: "Visite d'appartement",
    en: 'Apartment viewing',
    desc: "Tour, negotiate, ask about charges and the lease.",
    level: 'B1',
    topics: ['Housing', 'Numbers'],
  },
];

const PAST_SESSIONS = [
  { id: 's5', date: 'Apr 24', dateLong: 'Friday, April 24, 2026',  scenarioId: 'cafe',     scenario: 'Ordering at a café',         duration: '38 min', durationMin: 38, turns: 42, diagnostic: 'run',     score: 81, excerpt: "— Bonjour, je voudrais un café allongé, s'il vous plaît." },
  { id: 's4', date: 'Apr 23', dateLong: 'Thursday, April 23, 2026', scenarioId: 'news',     scenario: 'Discussing current events',  duration: '52 min', durationMin: 52, turns: 61, diagnostic: 'run',     score: 74, excerpt: "— Je trouve que la couverture médiatique manque de nuance, honnêtement." },
  { id: 's3', date: 'Apr 22', dateLong: 'Wednesday, April 22, 2026',scenarioId: 'freestyle',scenario: 'Freestyle',                  duration: '24 min', durationMin: 24, turns: 27, diagnostic: 'not-run', score: null, excerpt: "— On a parlé du voyage en Bretagne, des huîtres surtout." },
  { id: 's2', date: 'Apr 20', dateLong: 'Monday, April 20, 2026',   scenarioId: 'work',     scenario: 'Work meeting',               duration: '41 min', durationMin: 41, turns: 49, diagnostic: 'run',     score: 78, excerpt: "— Si je peux me permettre, le calendrier me paraît un peu serré." },
  { id: 's1', date: 'Apr 18', dateLong: 'Saturday, April 18, 2026', scenarioId: 'chemin',   scenario: 'Asking for directions',      duration: '17 min', durationMin: 17, turns: 19, diagnostic: 'not-run', score: null, excerpt: "— Pardon madame, est-ce que vous savez où se trouve la rue de Bretagne ?" },
];

// Transcript French is genuine learning content; tooltips/notes are English.
const SAMPLE_TRANSCRIPT = [
  { who: 'ai',   text: "Bonjour, bienvenue. Qu'est-ce que je vous sers ?",     gloss: "Hello, welcome. What can I get you?" },
  { who: 'user', text: "Bonjour. Je voudrais un café allongé, s'il vous plaît.", gloss: "Hello. I'd like a long coffee, please." },
  { who: 'ai',   text: "Très bien. Avec ça, je vous propose une viennoiserie ?", gloss: "Very good. Can I offer you a pastry with that?" },
  { who: 'user', text: "Oui, je vais prendre un croissant. Est-ce qu'il est encore chaud ?", gloss: "Yes, I'll have a croissant. Is it still warm?" },
  { who: 'ai',   text: "Il vient de sortir du four, en fait. Vous mangez sur place ou à emporter ?", gloss: "It just came out of the oven, actually. Are you eating in or taking it away?" },
  { who: 'user', text: "Sur place, merci. Je peut m'asseoir près de la fenêtre ?", gloss: "Eating in, thanks. Can I sit by the window?",
    grammarIssues: [{ from: 8, to: 12, original: 'Je peut', correction: 'Je peux', note: '« pouvoir » in the first person singular takes -x: je peux.' }] },
  { who: 'ai',   text: "Bien sûr, installez-vous. Je vous apporte ça dans un instant.", gloss: "Of course, make yourself comfortable. I'll bring it to you in a moment." },
  { who: 'user', text: "Merci. Au fait, vous avez le wifi ? Je dois envoyer un mail rapide.", gloss: "Thanks. By the way, do you have wifi? I have to send a quick email." },
  { who: 'ai',   text: "Oui, le code est sur le ticket. Bon courage pour votre travail.", gloss: "Yes, the code is on the receipt. Good luck with your work." },
  { who: 'user', text: "C'est gentil. J'ai une réunion difficile cette après-midi.", gloss: "That's kind. I have a difficult meeting this afternoon.",
    grammarIssues: [{ from: 16, to: 32, original: 'cette après-midi', correction: 'cet après-midi', note: '« après-midi » is generally masculine: cet après-midi.' }] },
];

const PRONUNCIATION_ISSUES = [
  { word: 'allongé', phoneme: '/ɑ̃/', score: 62, note: "The nasal vowel is flattening into /an/. Tongue stays low; air passes through the nose.", turnIndex: 1 },
  { word: "qu'il",   phoneme: '/i/',  score: 71, note: "French /i/ is more tense than the English equivalent. Thin smile, jaw closed.",         turnIndex: 3 },
  { word: 'fenêtre', phoneme: '/ɛ/',  score: 68, note: "The circumflex opens the vowel. Closer to “bête” than to “né”.",                       turnIndex: 5 },
  { word: 'rapide',  phoneme: '/ʁ/',  score: 74, note: "The French R is formed in the throat. Think of a very light scrape, not a roll.",      turnIndex: 7 },
];

const VOCAB = {
  comfortable: [
    { fr: 'voudrais', en: 'would like' },
    { fr: "s'il vous plaît", en: 'please' },
    { fr: 'merci', en: 'thank you' },
    { fr: 'sur place', en: 'for here' },
    { fr: 'à emporter', en: 'to go' },
    { fr: 'la fenêtre', en: 'window' },
    { fr: 'rapide', en: 'quick' },
    { fr: 'gentil', en: 'kind' },
  ],
  stumbled: [
    { fr: 'allongé', en: 'long (coffee)', note: 'briefly searched' },
    { fr: 'viennoiserie', en: 'pastry', note: 'recognised, not produced' },
    { fr: "m'installer", en: 'to settle in', note: 'avoided via paraphrase' },
    { fr: 'apporter', en: 'to bring', note: 'confused with “emporter”' },
  ],
};

// Streak / progress data for the dashboard's secondary pages.
const PROGRESS = {
  streakDays: 18,
  weekMinutes: 172,
  weekTarget: 210,
  monthMinutes: 612,
  totalSessions: 47,
  level: 'B1',
  levelProgress: 0.62,
  levelNext: 'B2',
  // 35-day grid — weeks of activity heat (0..3)
  heat: [
    1,2,0,2,1,3,0,
    1,1,2,3,2,1,0,
    2,2,1,0,3,2,1,
    3,2,2,1,2,3,2,
    1,2,3,2,1,2,2,
  ],
  scoreHistory: [
    { date: 'Apr 4', score: 64 }, { date: 'Apr 6', score: 67 }, { date: 'Apr 9', score: 70 },
    { date: 'Apr 12', score: 72 }, { date: 'Apr 15', score: 71 }, { date: 'Apr 18', score: 75 },
    { date: 'Apr 20', score: 78 }, { date: 'Apr 23', score: 74 }, { date: 'Apr 24', score: 81 },
  ],
};

Object.assign(window, { SCENARIOS, PAST_SESSIONS, SAMPLE_TRANSCRIPT, PRONUNCIATION_ISSUES, VOCAB, PROGRESS });
