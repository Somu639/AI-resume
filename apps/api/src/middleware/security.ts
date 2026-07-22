import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { env } from "../config/env";

function allowedOrigins(): Set<string> {
  const origins = new Set<string>([env.CLIENT_URL]);
  for (const extra of env.CLIENT_URLS.split(",")) {
    const trimmed = extra.trim();
    if (trimmed) origins.add(trimmed);
  }
  return origins;
}

/** In development, Next often hops ports (3000→3004); allow any local origin. */
function isLocalDevOrigin(origin: string): boolean {
  if (env.isProd) return false;
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]")
    );
  } catch {
    return false;
  }
}

export function securityMiddleware() {
  const origins = allowedOrigins();

  return [
    helmet({
      contentSecurityPolicy: env.isProd
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "no-referrer" },
      hsts: env.isProd
        ? { maxAge: 15552000, includeSubDomains: true, preload: true }
        : false,
    }),
    cors({
      origin: (origin, callback) => {
        if (!origin || origins.has(origin) || isLocalDevOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Request-Id",
      ],
      maxAge: 600,
    }),
    hpp(),
  ];
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const incoming = req.header("x-request-id");
  const id =
    incoming && incoming.length < 128
      ? incoming
      : `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-Id", id);
  next();
}
