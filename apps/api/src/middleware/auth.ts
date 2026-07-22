import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";
import { verifyAccessToken } from "../lib/jwt";

export type AuthUser = {
  id: string;
  email: string;
  plan: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Require a valid Bearer access token and attach `req.user`.
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    const bearer =
      header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined;
    const cookieToken =
      typeof req.cookies?.access_token === "string"
        ? req.cookies.access_token
        : undefined;
    const token = bearer || cookieToken;

    if (!token) {
      throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      plan: payload.plan,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

/** Optional auth — attaches user when token present, never fails. */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
      ? header.slice(7).trim()
      : undefined;
    if (token) {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        plan: payload.plan,
      };
    }
  } catch {
    // ignore
  }
  next();
}
