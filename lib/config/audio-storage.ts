/**
 * Where browser-recorded session chunks are stored (M2).
 *
 * - `s3` — presigned PUT to AWS (production).
 * - `local` — same HTTP flow, but `PUT /api/audio/chunk/...` writes under `LOCAL_AUDIO_DIR` (dev / CI without AWS).
 */

export type AudioStorageBackend = "s3" | "local";

/**
 * `AUDIO_STORAGE_BACKEND=local` | `s3` (default **`s3`**).
 */
export function getAudioStorageBackend(): AudioStorageBackend {
  const v = process.env.AUDIO_STORAGE_BACKEND?.trim().toLowerCase();
  if (v === "local") {
    return "local";
  }
  return "s3";
}

export function isLocalAudioStorage(): boolean {
  return getAudioStorageBackend() === "local";
}
