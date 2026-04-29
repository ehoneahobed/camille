/** Simple in-memory cooldown between ephemeral token mints per user (dev / single-instance). */

const lastMintByUser = new Map<string, number>();

const MIN_INTERVAL_MS = 2000;

export function allowRealtimeTokenMint(userId: string): boolean {
  const now = Date.now();
  const last = lastMintByUser.get(userId) ?? 0;
  if (now - last < MIN_INTERVAL_MS) {
    return false;
  }
  lastMintByUser.set(userId, now);
  return true;
}
