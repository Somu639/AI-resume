import * as Sentry from "@sentry/node";
import { env } from "../config/env";
import { logger } from "./logger";

let initialized = false;

export function initSentry() {
  if (initialized || !env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.isProd ? 0.15 : 1.0,
    sendDefaultPii: false,
  });

  initialized = true;
  logger.info("Sentry error tracking initialized");
}

export { Sentry };
