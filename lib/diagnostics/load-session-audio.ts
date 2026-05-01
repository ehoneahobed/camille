import { GetObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireS3Config } from "@/lib/config/s3";
import { getS3ClientForConfig } from "@/lib/s3/s3-client";
import { getLocalAudioRootDir } from "@/lib/storage/local-audio-paths";

export type SessionAudioBlob = {
  bytes: Buffer;
  /** MIME for Gemini / Azure (e.g. audio/webm, audio/wav). */
  mimeType: string;
};

/**
 * Loads finalized session audio from local disk (`local:` DB prefix) or S3 object key.
 */
export async function loadSessionAudioForDiagnostics(audioS3Key: string): Promise<SessionAudioBlob> {
  if (audioS3Key.startsWith("local:")) {
    const rel = audioS3Key.slice("local:".length);
    const filePath = path.join(getLocalAudioRootDir(), ...rel.split("/").filter(Boolean));
    const bytes = await readFile(filePath);
    return { bytes, mimeType: "audio/webm" };
  }

  const cfg = requireS3Config();
  const client = getS3ClientForConfig(cfg);
  const out = await client.send(
    new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: audioS3Key,
    }),
  );
  const body = out.Body;
  if (!body) {
    throw new Error("S3 GetObject returned empty body");
  }
  const bytes = Buffer.from(await body.transformToByteArray());
  const mimeType = out.ContentType?.trim() || "audio/webm";
  return { bytes, mimeType };
}
