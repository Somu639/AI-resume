import path from "path";
import OpenAI from "openai";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

type Provider = "groq" | "openai";

function providerForKey(apiKey: string): Provider {
  const explicit = (env.LLM_PROVIDER || "").trim().toLowerCase();
  if (explicit === "groq" || explicit === "openai") return explicit;

  if (env.OPENAI_BASE_URL?.includes("groq.com") || apiKey.startsWith("gsk_")) {
    return "groq";
  }
  return "openai";
}

function modelForProvider(mode: Provider): string {
  const configured = env.OPENAI_MODEL?.trim();
  if (mode === "groq") {
    if (!configured || configured.startsWith("gpt-") || configured.includes("o1")) {
      return GROQ_DEFAULT_MODEL;
    }
    return configured;
  }
  return configured || "gpt-4o";
}

function baseUrlForProvider(mode: Provider): string | undefined {
  return env.OPENAI_BASE_URL?.trim() || (mode === "groq" ? GROQ_BASE_URL : undefined);
}

/** Ordered, de-duplicated list of configured API keys (primary first). */
function apiKeys(): string[] {
  const keys = [env.OPENAI_API_KEY, env.OPENAI_API_KEY_FALLBACK]
    .map((k) => k?.trim() ?? "")
    .filter(Boolean);
  return [...new Set(keys)];
}

export type LlmClient = {
  client: OpenAI;
  model: string;
  label: string;
};

/**
 * All configured LLM clients in priority order. When more than one key is set,
 * later ones act as automatic failover if earlier ones are rate-limited.
 */
export function createLlmClients(): LlmClient[] {
  const keys = apiKeys();
  if (keys.length === 0) {
    throw new AppError(
      503,
      "LLM is not configured. Set OPENAI_API_KEY (free Groq key recommended)."
    );
  }

  return keys.map((key, index) => {
    const mode = providerForKey(key);
    const baseURL = baseUrlForProvider(mode);
    return {
      client: new OpenAI({ apiKey: key, ...(baseURL ? { baseURL } : {}) }),
      model: modelForProvider(mode),
      label: index === 0 ? "primary" : `fallback-${index}`,
    };
  });
}

/** Backwards-compatible single client (primary key). */
export function createLlmClient(): OpenAI {
  return createLlmClients()[0]!.client;
}

/** Model id for the primary provider. */
export function getLlmModel(): string {
  return createLlmClients()[0]!.model;
}

/** Detect provider rate-limit / daily-quota errors so callers can degrade or fail over. */
export function isRateLimitError(error: unknown): boolean {
  const status =
    (typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: unknown }).status) ||
    undefined;
  if (status === 429) return true;

  const message = error instanceof Error ? error.message : String(error);
  return /\b429\b|rate[\s-]?limit|tokens? per day|\bTPD\b|quota|too many requests/i.test(
    message
  );
}

/**
 * Run a JSON chat completion with automatic key failover.
 * Tries each configured client in order; on a rate-limit error it moves to the
 * next key. Non-rate-limit errors fail fast. If every key is rate-limited, the
 * final rate-limit error is thrown so upstream callers can degrade gracefully.
 */
export async function chatJsonWithFailover(input: {
  system: string;
  user: string;
  temperature: number;
  label: string;
  clients?: LlmClient[];
}): Promise<string> {
  const clients = input.clients ?? createLlmClients();
  let lastError: unknown;

  for (const { client, model, label } of clients) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: input.temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AppError(502, `OpenAI returned an empty ${input.label} response`);
      }
      return content;
    } catch (error) {
      lastError = error;
      // Rate-limited on this key → try the next configured key (if any).
      if (isRateLimitError(error)) continue;
      const message = error instanceof Error ? error.message : "Unknown OpenAI error";
      throw new AppError(502, `OpenAI ${input.label} failed (${label}): ${message}`);
    }
  }

  // Every key was rate-limited.
  const message =
    lastError instanceof Error ? lastError.message : "all keys rate-limited";
  throw new AppError(502, `OpenAI ${input.label} failed: ${message}`);
}

export function envFileCandidates(): string[] {
  return [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "apps/api/.env"),
    path.resolve(__dirname, "../../.env"),
  ];
}
