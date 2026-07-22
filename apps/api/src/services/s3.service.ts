import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

/**
 * AWS S3 storage adapter.
 * In development without credentials, falls back to an in-memory map
 * so local flows still work (not for production).
 */
const memoryStore = new Map<string, Buffer>();

function hasAwsCreds() {
  return Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);
}

function client() {
  return new S3Client({
    region: env.AWS_REGION,
    credentials: hasAwsCreds()
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
  });
}

export const s3Service = {
  async upload(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }) {
    if (!hasAwsCreds() && !env.isProd) {
      memoryStore.set(input.key, input.body);
      return { key: input.key, bucket: env.S3_BUCKET, mocked: true };
    }

    try {
      await client().send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
        })
      );
      return { key: input.key, bucket: env.S3_BUCKET, mocked: false };
    } catch (error) {
      throw new AppError(
        502,
        error instanceof Error ? error.message : "S3 upload failed",
        "S3_UPLOAD_FAILED"
      );
    }
  },

  async getSignedUrl(key: string, expiresInSeconds = 300) {
    if (!hasAwsCreds() && !env.isProd) {
      return `memory://${key}`;
    }
    return getSignedUrl(
      client(),
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
      { expiresIn: expiresInSeconds }
    );
  },

  async delete(key: string) {
    if (!hasAwsCreds() && !env.isProd) {
      memoryStore.delete(key);
      return;
    }
    await client().send(
      new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
    );
  },

  /** Test helper / local download */
  getMemoryObject(key: string) {
    return memoryStore.get(key);
  },
};
