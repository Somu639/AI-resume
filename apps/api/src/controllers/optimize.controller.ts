import type { NextFunction, Request, Response } from "express";
import { optimizeResumeRequestSchema } from "../engines/resume-optimization";
import { AppError } from "../middleware/errorHandler";
import { optimizeService } from "../services/optimize.service";

export async function optimizeResumeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = optimizeResumeRequestSchema.safeParse(req.body);
    if (!body.success) {
      throw new AppError(
        400,
        body.error.errors[0]?.message ?? "Invalid optimize request body"
      );
    }

    // Persist version history when the caller is an authenticated user
    const result = await optimizeService.optimize(body.data, req.user?.id);
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}
