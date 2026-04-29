import { getAudioStorageBackend } from "@/lib/config/audio-storage";
import { finalizePracticeSessionAudioS3 } from "@/lib/s3/finalize-practice-audio-s3";
import { finalizePracticeSessionAudioLocal } from "@/lib/storage/local-audio-finalize";

/**
 * Runs after `PracticeSession` is marked `ENDED` (via `after()` in the PATCH handler).
 */
export async function finalizePracticeSessionAudio(sessionId: string): Promise<void> {
  if (getAudioStorageBackend() === "local") {
    await finalizePracticeSessionAudioLocal(sessionId);
    return;
  }
  await finalizePracticeSessionAudioS3(sessionId);
}
