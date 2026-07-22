import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { Sentry } from "../lib/sentry";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn(
      { err, path: req.path, method: req.method, status: err.statusCode },
      err.message
    );
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    });
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  if (env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  return res.status(500).json({
    message: env.isProd ? "Internal server error" : String(err),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}
