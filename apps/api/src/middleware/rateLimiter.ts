import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { env } from "../config/env";

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

/** Stricter limiter for AI-heavy endpoints. */
export const aiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI rate limit exceeded. Please wait and retry." },
});

export const speedLimiter = slowDown({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  delayAfter: Math.floor(env.RATE_LIMIT_MAX * 0.6),
  delayMs: (hits) => Math.min(hits * 50, 2000),
});

/** Optional shared API key gate for service-to-service calls. */
export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  if (!env.API_KEY) return next();

  const key =
    req.header("x-api-key") ||
    req.header("authorization")?.replace(/^ApiKey\s+/i, "");

  if (key !== env.API_KEY) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  return next();
}
