/**
 * Maximum in-progress session length for realtime token mint (M2-T16).
 */

const DEFAULT_MAX_MINUTES = 45;

export function getMaxSessionMinutes(): number {
  const raw = process.env.MAX_SESSION_MINUTES?.trim();
  if (!raw) {
    return DEFAULT_MAX_MINUTES;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 240) {
    return DEFAULT_MAX_MINUTES;
  }
  return n;
}

export function practiceElapsedMs(startedAt: Date): number {
  return Date.now() - startedAt.getTime();
}

export function isPastMaxSession(startedAt: Date): boolean {
  return practiceElapsedMs(startedAt) >= getMaxSessionMinutes() * 60 * 1000;
}

export function sessionSoftWarningAtMs(startedAt: Date): boolean {
  const maxMs = getMaxSessionMinutes() * 60 * 1000;
  return practiceElapsedMs(startedAt) >= maxMs * 0.8;
}
