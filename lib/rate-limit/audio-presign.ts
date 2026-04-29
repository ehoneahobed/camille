/** In-memory cap on presign requests per user (single-instance dev / small deploy). */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

type Entry = { windowStart: number; count: number };

const byUser = new Map<string, Entry>();

export function allowAudioPresign(userId: string): boolean {
  const now = Date.now();
  const e = byUser.get(userId);
  if (!e || now - e.windowStart >= WINDOW_MS) {
    byUser.set(userId, { windowStart: now, count: 1 });
    return true;
  }
  if (e.count >= MAX_PER_WINDOW) {
    return false;
  }
  e.count += 1;
  return true;
}
