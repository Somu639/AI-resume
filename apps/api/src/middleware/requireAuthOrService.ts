import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { authMiddleware } from "./auth";

/**
 * Allow either a logged-in user (JWT) or a trusted service API key
 * (Streamlit / internal workers).
 */
export function requireAuthOrService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.header("x-api-key");
  if (env.API_KEY && key && key === env.API_KEY) {
    return next();
  }
  return authMiddleware(req, res, next);
}
