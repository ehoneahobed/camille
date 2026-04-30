"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_SLICE = 5000;
const MAX_RETRIES = 5;

/** Presign / chunk PUT return this when the practice session is no longer `IN_PROGRESS`. */
const SESSION_NOT_ACTIVE = "Session is not active";

function isSessionNotActiveResponse(status: number, body: unknown): boolean {
  if (status !== 409) return false;
  if (typeof body !== "object" || body === null || !("error" in body)) return false;
  return String((body as { error: unknown }).error) === SESSION_NOT_ACTIVE;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function pickRecorderMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "video/webm;codecs=opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return "audio/webm";
}

export type UseSessionRecorderOptions = {
  sessionId: string;
  mediaStream: MediaStream | null;
  /** When true, records `mediaStream` into timesliced blobs and uploads via presigned PUT. */
  active: boolean;
  timesliceMs?: number;
};

/**
 * Browser `MediaRecorder` with ~5s timeslices; uploads via `POST /api/audio/presign`
 * then `PUT` to either S3 (presigned) or the app (`AUDIO_STORAGE_BACKEND=local`) (M2-T04).
 */
export function useSessionRecorder(options: UseSessionRecorderOptions) {
  const { sessionId, mediaStream, active, timesliceMs = DEFAULT_SLICE } = options;
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMaxIndex, setUploadedMaxIndex] = useState(-1);
  const nextChunkIndexRef = useRef(0);
  const queueRef = useRef(Promise.resolve());

  const uploadChunk = useCallback(
    async (chunkIndex: number, blob: Blob) => {
      const contentType = pickRecorderMime();
      const presign = await fetch("/api/audio/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, chunkIndex, contentType }),
      });
      const presignBody = await presign.json().catch(async () => ({
        error: await presign.text(),
      }));
      if (!presign.ok) {
        if (isSessionNotActiveResponse(presign.status, presignBody)) {
          return;
        }
        throw new Error(
          typeof presignBody === "object" && presignBody && "error" in presignBody
            ? String((presignBody as { error: unknown }).error)
            : `Presign ${presign.status}`,
        );
      }
      const { url } = presignBody as { url: string; storage?: string };

      let lastErr: unknown;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const put = await fetch(url, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": contentType },
          });
          if (!put.ok) {
            if (put.status === 409) {
              const putBody = await put.json().catch(async () => ({
                error: await put.text(),
              }));
              if (isSessionNotActiveResponse(put.status, putBody)) {
                return;
              }
            }
            throw new Error(`PUT ${put.status}`);
          }
          console.info("[analytics] audio_chunk_uploaded", { sessionId, chunkIndex });
          setUploadedMaxIndex((prev) => Math.max(prev, chunkIndex));
          return;
        } catch (e) {
          lastErr = e;
          await sleep(400 * 2 ** attempt);
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error("Upload failed");
    },
    [sessionId],
  );

  useEffect(() => {
    if (!active || !mediaStream) {
      return;
    }

    const clearErr = window.setTimeout(() => setUploadError(null), 0);
    const mime = pickRecorderMime();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(mediaStream, { mimeType: mime });
    } catch {
      clearTimeout(clearErr);
      window.setTimeout(() => {
        setUploadError("MediaRecorder is not supported for this microphone stream.");
      }, 0);
      return;
    }

    const enqueue = (blob: Blob) => {
      const idx = nextChunkIndexRef.current++;
      queueRef.current = queueRef.current.then(() =>
        uploadChunk(idx, blob).catch((e) => {
          const msg = e instanceof Error ? e.message : "Chunk upload failed";
          if (msg === SESSION_NOT_ACTIVE) {
            return;
          }
          console.error(e);
          setUploadError(msg);
        }),
      );
    };

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) {
        enqueue(ev.data);
      }
    };

    recorder.start(timesliceMs);

    return () => {
      clearTimeout(clearErr);
      recorder.stop();
    };
  }, [active, mediaStream, timesliceMs, uploadChunk]);

  return { uploadError, uploadedMaxIndex };
}
