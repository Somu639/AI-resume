import type { NextFunction, Request, Response } from "express";
import { analyzeJobDescriptionInputSchema } from "../engines/job-description";
import { AppError } from "../middleware/errorHandler";
import { jobDescriptionAnalysisService } from "../services/jobDescriptionAnalysis.service";

export async function analyzeJobDescriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = analyzeJobDescriptionInputSchema.safeParse({
      jobDescription:
        typeof req.body?.jobDescription === "string"
          ? req.body.jobDescription
          : typeof req.body?.text === "string"
            ? req.body.text
            : "",
    });

    if (!body.success) {
      throw new AppError(
        400,
        body.error.errors[0]?.message ?? "Invalid request body"
      );
    }

    const analysis = await jobDescriptionAnalysisService.analyze(
      body.data.jobDescription
    );

    return res.status(200).json({
      data: analysis,
    });
  } catch (error) {
    return next(error);
  }
}
