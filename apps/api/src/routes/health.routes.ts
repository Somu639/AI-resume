import { Router } from "express";
import { env } from "../config/env";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "resumeai-api",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/ready", (_req, res) => {
  const checks = {
    database: Boolean(env.DATABASE_URL),
    openai: Boolean(env.OPENAI_API_KEY) || !env.isProd,
    s3: Boolean(env.S3_BUCKET),
  };

  const ready = Object.values(checks).every(Boolean);
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "degraded",
    checks,
  });
});
