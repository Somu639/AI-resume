import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { authService } from "../services/auth.service";
import { authMiddleware } from "../middleware/auth";

const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax" as const,
  path: "/",
};

function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) {
  res.cookie("access_token", tokens.accessToken, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", tokens.refreshToken, {
    ...cookieOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function handleZod(error: unknown, next: NextFunction) {
  if (error instanceof ZodError) {
    return next(
      new AppError(400, error.errors[0]?.message ?? "Invalid request body")
    );
  }
  return next(error);
}

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, result);
    return res.status(201).json({ data: result });
  } catch (error) {
    return handleZod(error, next);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.login(req.body);
    setAuthCookies(res, result);
    return res.status(200).json({ data: result });
  } catch (error) {
    return handleZod(error, next);
  }
}

export async function googleHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.google(req.body);
    setAuthCookies(res, result);
    return res.status(200).json({ data: result });
  } catch (error) {
    return handleZod(error, next);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token =
      (typeof req.body?.refreshToken === "string"
        ? req.body.refreshToken
        : undefined) ||
      (typeof req.cookies?.refresh_token === "string"
        ? req.cookies.refresh_token
        : undefined);
    if (!token) throw new AppError(400, "refreshToken is required");
    const result = await authService.refresh(token);
    setAuthCookies(res, result);
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}

export async function logoutHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.clearCookie("access_token", cookieOpts);
  res.clearCookie("refresh_token", cookieOpts);
  return res.status(200).json({ data: { ok: true } });
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new AppError(401, "Authentication required");
    const me = await authService.me(req.user.id);
    return res.status(200).json({ data: me });
  } catch (error) {
    return next(error);
  }
}

export { authMiddleware };
