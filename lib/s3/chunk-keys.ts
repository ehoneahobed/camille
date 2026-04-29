import type { S3AppConfig } from "@/lib/config/s3";

/** Relative object key (shared by S3 and local disk layout). */
export function chunkObjectKeyFromPrefix(
  keyPrefix: string,
  sessionId: string,
  chunkIndex: number,
): string {
  return `${keyPrefix}sessions/${sessionId}/chunks/${chunkIndex}.webm`;
}

/** Object key for one timesliced recording chunk (browser PUT). */
export function chunkObjectKey(cfg: S3AppConfig, sessionId: string, chunkIndex: number): string {
  return chunkObjectKeyFromPrefix(cfg.keyPrefix, sessionId, chunkIndex);
}

/** Canonical merged object key after finalize (single-chunk copy only today). */
export function finalAudioObjectKeyFromPrefix(keyPrefix: string, sessionId: string): string {
  return `${keyPrefix}sessions/${sessionId}/audio.webm`;
}

export function finalAudioObjectKey(cfg: S3AppConfig, sessionId: string): string {
  return finalAudioObjectKeyFromPrefix(cfg.keyPrefix, sessionId);
}

/** Prefix for listing all chunks of a practice session. */
export function chunksListPrefixFromKeyPrefix(keyPrefix: string, sessionId: string): string {
  return `${keyPrefix}sessions/${sessionId}/chunks/`;
}

export function chunksListPrefix(cfg: S3AppConfig, sessionId: string): string {
  return chunksListPrefixFromKeyPrefix(cfg.keyPrefix, sessionId);
}
