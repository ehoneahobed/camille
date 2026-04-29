import path from "node:path";
import { getS3KeyPrefix } from "@/lib/config/s3";
import {
  chunkObjectKeyFromPrefix,
  finalAudioObjectKeyFromPrefix,
} from "@/lib/s3/chunk-keys";

/**
 * Root directory for on-disk session audio (never committed; see `.gitignore`).
 * Override with `LOCAL_AUDIO_DIR` (absolute or relative to cwd).
 */
export function getLocalAudioRootDir(): string {
  const raw = process.env.LOCAL_AUDIO_DIR?.trim();
  if (raw) {
    return path.isAbsolute(raw)
      ? raw
      : path.join(/* turbopackIgnore: true */ process.cwd(), raw);
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "session-audio");
}

/** Filesystem path for one chunk blob. */
export function localChunkFilePath(sessionId: string, chunkIndex: number): string {
  const keyPrefix = getS3KeyPrefix();
  const rel = chunkObjectKeyFromPrefix(keyPrefix, sessionId, chunkIndex);
  return path.join(getLocalAudioRootDir(), ...rel.split("/").filter(Boolean));
}

export function localFinalAudioFilePath(sessionId: string): string {
  const keyPrefix = getS3KeyPrefix();
  const rel = finalAudioObjectKeyFromPrefix(keyPrefix, sessionId);
  return path.join(getLocalAudioRootDir(), ...rel.split("/").filter(Boolean));
}

export function localChunksDir(sessionId: string): string {
  const keyPrefix = getS3KeyPrefix();
  const rel = `${keyPrefix}sessions/${sessionId}/chunks`;
  return path.join(getLocalAudioRootDir(), ...rel.split("/").filter(Boolean));
}

/**
 * Value stored in `PracticeSession.audioS3Key` for local backend (M3 can branch on `local:` prefix).
 */
export function localAudioDbKey(sessionId: string): string {
  const keyPrefix = getS3KeyPrefix();
  return `local:${finalAudioObjectKeyFromPrefix(keyPrefix, sessionId)}`;
}
