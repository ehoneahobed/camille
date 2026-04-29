import { S3Client } from "@aws-sdk/client-s3";
import type { S3AppConfig } from "@/lib/config/s3";

let cached: { cfg: S3AppConfig; client: S3Client } | null = null;

export function getS3ClientForConfig(cfg: S3AppConfig): S3Client {
  if (cached?.cfg.bucket === cfg.bucket && cached.cfg.region === cfg.region) {
    return cached.client;
  }
  const client = new S3Client({ region: cfg.region });
  cached = { cfg, client };
  return client;
}
