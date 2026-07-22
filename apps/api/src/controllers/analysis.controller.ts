import type { NextFunction, Request, Response } from "express";
import { atsScoreRequestSchema } from "../engines/ats-scoring";
import { AppError } from "../middleware/errorHandler";
import { atsScoringService } from "../services/atsScoring.service";

export async function scoreAtsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = atsScoreRequestSchema.safeParse(req.body);
    if (!body.success) {
      throw new AppError(
        400,
        body.error.errors[0]?.message ?? "Invalid ATS score request body"
      );
    }

    const result = atsScoringService.score(body.data);
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}
