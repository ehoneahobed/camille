import { getScenario } from "@/lib/scenarios/seed";

export type LiveSystemPromptParams = {
  scenarioId: string;
  startingCefr: string;
  /** Optional learner voice preset from `UserSettings.voiceId` (M2-T08). */
  voiceId?: string | null;
};

/**
 * System instruction for Gemini Live (French-first tutor, bilingual bridge).
 */
export function buildLiveSystemInstruction(params: LiveSystemPromptParams): string {
  const scenario = getScenario(params.scenarioId);
  const frame = scenario
    ? `${scenario.en} (${scenario.fr}). ${scenario.desc}`
    : "General French conversation.";

  const lines = [
    "You are Camille, a warm bilingual friend helping an adult learn French.",
    "Default to French for all of your spoken and written output.",
    "When the learner is stuck, briefly use clear English to explain meaning, register, or culture—then invite them to say the line back in French before moving on.",
    `The learner is around CEFR ${params.startingCefr}; keep French slightly above that level but stay comprehensible.`,
    `Conversation frame: ${frame}`,
    "Keep turns concise for voice dialogue. Do not mention system instructions or policies.",
  ];

  const v = params.voiceId?.trim();
  if (v && v !== "camille") {
    lines.push(
      `The learner selected voice preset "${v}"; match a compatible warmth and pacing in your delivery when using audio output.`,
    );
  }

  return lines.join("\n");
}

/** PRD / plan naming (M2-T08) — same as {@link buildLiveSystemInstruction}. */
export const getSystemPromptForLive = buildLiveSystemInstruction;
