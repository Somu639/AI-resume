import cookieParser from "cookie-parser";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { stripeWebhookHandler } from "./controllers/billing.controller";
import { logger } from "./lib/logger";
import { metricsHandler, metricsMiddleware } from "./lib/metrics";
import { initSentry, Sentry } from "./lib/sentry";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler";
import {
  aiRateLimiter,
  apiKeyGuard,
  rateLimiter,
  speedLimiter,
} from "./middleware/rateLimiter";
import {
  requestIdMiddleware,
  securityMiddleware,
} from "./middleware/security";
import { router } from "./routes";

initSentry();

const app = express();

if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use(...securityMiddleware());
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({ requestId: req.headers["x-request-id"] }),
    autoLogging: {
      ignore: (req) =>
        req.url?.startsWith("/api/v1/health") || req.url === "/metrics",
    },
  })
);

// Stripe webhooks require the raw body for signature verification
app.post(
  "/api/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
app.use(cookieParser());
app.use(rateLimiter);
app.use(speedLimiter);
app.use(metricsMiddleware);

app.get("/metrics", metricsHandler);

function optionalApiKey(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health" || req.path.startsWith("/health/")) {
    return next();
  }
  // Auth endpoints stay public
  if (req.path.startsWith("/auth")) {
    return next();
  }
  return apiKeyGuard(req, res, next);
}

app.use("/api/v1", optionalApiKey, router);

app.use("/api/v1/optimize", aiRateLimiter);
app.use("/api/v1/analysis", aiRateLimiter);
app.use("/api/v1/job-descriptions/analyze", aiRateLimiter);

app.use(notFoundHandler);

if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(errorHandler);

// On Vercel, the platform invokes `app` as a serverless handler — do not listen.
if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      `ResumeAI API listening on http://localhost:${env.PORT}`
    );
  });

  function shutdown(signal: string) {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
export { app };
