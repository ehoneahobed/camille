/**
 * Scenario metadata (PRD S-1). Prompts are built in `lib/prompts/live-system.ts`.
 */
export type CefrBand = "A2" | "B1" | "B2" | "C1";

export type ScenarioRecord = {
  id: string;
  fr: string;
  en: string;
  desc: string;
  level: string;
  /** Bands used by the scenarios grid filter chips */
  cefrBands: CefrBand[];
  topics: string[];
};

export const SCENARIOS: ScenarioRecord[] = [
  {
    id: "freestyle",
    fr: "Conversation libre",
    en: "Freestyle",
    desc: "No frame. You pick the topic, the pace, and the register.",
    level: "A2 — C1",
    cefrBands: ["A2", "B1", "B2", "C1"],
    topics: ["Open-ended", "Any register"],
  },
  {
    id: "cafe",
    fr: "Au café",
    en: "Ordering at a café",
    desc: "Order, ask for the menu, pay. Everyday vocabulary, informal register.",
    level: "A2",
    cefrBands: ["A2"],
    topics: ["Food & drink", "Polite forms"],
  },
  {
    id: "chemin",
    fr: "Demander son chemin",
    en: "Asking for directions",
    desc: "Landmarks, prepositions of place, polite forms with a stranger.",
    level: "A2",
    cefrBands: ["A2"],
    topics: ["Navigation", "Strangers"],
  },
  {
    id: "small",
    fr: "Petite conversation",
    en: "Casual small talk",
    desc: "Weather, weekend, films. Maintain fluency without high stakes.",
    level: "B1",
    cefrBands: ["B1"],
    topics: ["Daily life", "Light"],
  },
  {
    id: "work",
    fr: "Réunion de travail",
    en: "Work meeting",
    desc: "Professional register, agreement and disagreement, agenda items.",
    level: "B2",
    cefrBands: ["B2"],
    topics: ["Professional", "Formal"],
  },
  {
    id: "news",
    fr: "Discuter l'actualité",
    en: "Discussing current events",
    desc: "Argue, qualify, express doubt. Vocabulary from the press.",
    level: "B2 — C1",
    cefrBands: ["B2", "C1"],
    topics: ["Opinions", "Press"],
  },
  {
    id: "doctor",
    fr: "Chez le médecin",
    en: "At the doctor",
    desc: "Describe symptoms, understand instructions, ask follow-up questions.",
    level: "B1",
    cefrBands: ["B1"],
    topics: ["Health", "Specialised vocab"],
  },
  {
    id: "rental",
    fr: "Visite d'appartement",
    en: "Apartment viewing",
    desc: "Tour, negotiate, ask about charges and the lease.",
    level: "B1",
    cefrBands: ["B1"],
    topics: ["Housing", "Numbers"],
  },
];

const SCENARIO_IDS = new Set(SCENARIOS.map((s) => s.id));

export function isValidScenarioId(id: string): boolean {
  return SCENARIO_IDS.has(id);
}

export function getScenario(id: string): ScenarioRecord | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
