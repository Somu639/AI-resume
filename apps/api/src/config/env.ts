import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

// Try multiple locations — tsx may run with cwd at repo root or apps/api
for (const candidate of [
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "apps/api/.env"),
]) {
  const result = dotenv.config({ path: candidate });
  if (!result.error) break;
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  CLIENT_URLS: z.string().optional().default(""),
  DATABASE_URL: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-access-secret-change"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-refresh-secret-change"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("llama-3.3-70b-versatile"),
  /** Optional OpenAI-compatible base URL (Groq free: https://api.groq.com/openai/v1) */
  OPENAI_BASE_URL: z
    .string()
    .optional()
    .default("https://api.groq.com/openai/v1"),
  /** groq (free) | openai (paid). Auto-detected from key/base URL when empty. */
  LLM_PROVIDER: z.string().optional().default("groq"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),
  S3_BUCKET: z.string().default("resumeai-dev"),
  SENTRY_DSN: z.string().optional().default(""),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AI_RATE_LIMIT_MAX: z.coerce.number().default(30),
  API_KEY: z.string().optional().default(""),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PRICE_PRO: z.string().optional().default(""),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1")
    .default("false"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten());
  throw new Error("Invalid environment configuration");
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  isVercel: Boolean(process.env.VERCEL),
  require(name: keyof typeof parsed.data, fallback?: string): string {
    const value = String(parsed.data[name] ?? fallback ?? "");
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
  },
};

/** Soft checks — never crash the whole serverless process at import time. */
export const envWarnings: string[] = [];

if (env.isProd) {
  if (env.JWT_ACCESS_SECRET.includes("dev-") || env.JWT_ACCESS_SECRET.length < 32) {
    envWarnings.push(
      "JWT_ACCESS_SECRET is weak or missing — set a ≥32 char secret in Vercel env"
    );
  }
  if (!env.DATABASE_URL) {
    envWarnings.push("DATABASE_URL is not set — database routes will fail");
  }
  if (envWarnings.length) {
    console.warn("[resumeai-api] production env warnings:", envWarnings.join("; "));
  }
}
