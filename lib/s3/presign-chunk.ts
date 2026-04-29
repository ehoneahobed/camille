import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { S3AppConfig } from "@/lib/config/s3";
import { chunkObjectKey } from "@/lib/s3/chunk-keys";
import { getS3ClientForConfig } from "@/lib/s3/s3-client";

const PRESIGN_EXPIRES_SEC = 900;

export function assertAllowedAudioContentType(contentType: string): void {
  const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base !== "audio/webm" && base !== "video/webm") {
    throw new Error("contentType must be audio/webm or video/webm (optional codecs suffix)");
  }
}

export async function presignChunkPut(params: {
  cfg: S3AppConfig;
  sessionId: string;
  chunkIndex: number;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  assertAllowedAudioContentType(params.contentType);
  const key = chunkObjectKey(params.cfg, params.sessionId, params.chunkIndex);
  const client = getS3ClientForConfig(params.cfg);
  const cmd = new PutObjectCommand({
    Bucket: params.cfg.bucket,
    Key: key,
    /** Must match the browser PUT `Content-Type` header byte-for-byte for SigV4. */
    ContentType: params.contentType.trim(),
  });
  const url = await getSignedUrl(client, cmd, { expiresIn: PRESIGN_EXPIRES_SEC });
  return { url, key };
}
