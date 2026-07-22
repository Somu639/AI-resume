import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { generateCoverLetter } from "../engines/resume-optimization";
import { resumeJsonSchema } from "../engines/resume-optimization/schema";
import { jobDescriptionAnalysisSchema } from "../engines/job-description/schema";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { param } from "../utils/params";

const createSchema = z.object({
  resumeId: z.string().min(1).optional(),
  jobDescriptionId: z.string().min(1).optional(),
  resume: resumeJsonSchema.optional(),
  jobDescription: jobDescriptionAnalysisSchema.optional(),
});

export async function createCoverLetterHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = createSchema.parse(req.body);
    const userId = req.user!.id;

    let resumeJson = body.resume;
    let jobJson = body.jobDescription;
    let resumeId = body.resumeId;
    let jobDescriptionId = body.jobDescriptionId;

    if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId, deletedAt: null },
      });
      if (!resume?.parsedJson) {
        throw new AppError(400, "Resume not found or not parsed");
      }
      resumeJson = resumeJsonSchema.parse(resume.parsedJson);
    }

    if (jobDescriptionId) {
      const jd = await prisma.jobDescription.findFirst({
        where: { id: jobDescriptionId, userId },
      });
      if (!jd?.keywordsJson) {
        throw new AppError(400, "Job description not found or not analyzed");
      }
      jobJson = jobDescriptionAnalysisSchema.parse(jd.keywordsJson);
    }

    if (!resumeJson || !jobJson) {
      throw new AppError(
        400,
        "Provide resume + jobDescription JSON, or resumeId + jobDescriptionId"
      );
    }

    // Never invent experience — cover letter prompt is fact-bound to resume JSON
    const letter = await generateCoverLetter({
      resume: resumeJson,
      jobDescription: jobJson,
    });

    // Persist when we have relational ids
    let saved = null;
    if (resumeId && jobDescriptionId) {
      saved = await prisma.coverLetter.create({
        data: {
          userId,
          resumeId,
          jobDescriptionId,
          content: letter.body,
          greeting: letter.greeting,
          closing: letter.closing,
        },
      });
    }

    await prisma.usageEvent.create({
      data: {
        userId,
        type: "cover_letter",
        metaJson: { resumeId, jobDescriptionId },
      },
    });

    return res.status(201).json({
      data: {
        coverLetter: letter,
        record: saved,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCoverLetterHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const letter = await prisma.coverLetter.findFirst({
      where: { id: param(req.params.id), userId: req.user!.id },
    });
    if (!letter) throw new AppError(404, "Cover letter not found");
    return res.json({ data: letter });
  } catch (error) {
    return next(error);
  }
}
