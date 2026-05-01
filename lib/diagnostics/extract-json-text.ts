/**
 * Parses model output that should be JSON; tolerates optional ```json fences.
 */
export function parseModelJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const candidate = (fence ? fence[1] : trimmed).trim();
  return JSON.parse(candidate) as unknown;
}
