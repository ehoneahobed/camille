/**
 * S3 bucket configuration for session audio chunks (M2).
 * Bucket CORS must allow browser PUT from the app origin (see README).
 */

export type S3AppConfig = {
  bucket: string;
  region: string;
  /** e.g. `dev/` or `prod/` — never empty; trailing slash optional (normalized). */
  keyPrefix: string;
};

export function normalizeKeyPrefix(raw: string | undefined): string {
  const p = (raw ?? "dev").replace(/^\/*/, "").replace(/\/*$/, "");
  return p ? `${p}/` : "dev/";
}

/** Same layout segment as S3 object keys (`dev/`, `prod/`, …). */
export function getS3KeyPrefix(): string {
  return normalizeKeyPrefix(process.env.S3_KEY_PREFIX);
}

/**
 * Returns S3 config or throws if the bucket is not configured (caller returns 503).
 */
export function requireS3Config(): S3AppConfig {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) {
    throw new Error("Set AWS_S3_BUCKET for audio uploads.");
  }
  const region = process.env.AWS_REGION?.trim() || "us-east-1";
  return {
    bucket,
    region,
    keyPrefix: getS3KeyPrefix(),
  };
}
