import path from "path";
import OpenAI from "openai";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

function provider(): "groq" | "openai" {
  const explicit = (env.LLM_PROVIDER || "").trim().toLowerCase();
  if (explicit === "groq" || explicit === "openai") return explicit;

  const apiKey = env.OPENAI_API_KEY?.trim() ?? "";
  if (
    env.OPENAI_BASE_URL?.includes("groq.com") ||
    apiKey.startsWith("gsk_")
  ) {
    return "groq";
  }
  return "openai";
}

/**
 * Shared LLM client.
 * Default path is free Groq (OpenAI-compatible). OpenAI is opt-in and paid.
 */
export function createLlmClient(): OpenAI {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError(
      503,
      "LLM is not configured. Set OPENAI_API_KEY (free Groq key recommended)."
    );
  }

  const mode = provider();
  const baseURL =
    env.OPENAI_BASE_URL?.trim() ||
    (mode === "groq" ? GROQ_BASE_URL : undefined);

  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

/** Model id — Groq free tier uses Llama; OpenAI uses the configured paid model. */
export function getLlmModel(): string {
  const configured = env.OPENAI_MODEL?.trim();
  if (provider() === "groq") {
    if (!configured || configured.startsWith("gpt-") || configured.includes("o1")) {
      return GROQ_DEFAULT_MODEL;
    }
    return configured;
  }
  return configured || "gpt-4o";
}

export function envFileCandidates(): string[] {
  return [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "apps/api/.env"),
    path.resolve(__dirname, "../../.env"),
  ];
}
