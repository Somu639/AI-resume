import { Router } from "express";
import { analysisRouter } from "./analysis.routes";
import { authRouter } from "./auth.routes";
import { billingRouter } from "./billing.routes";
import { coverLetterRouter } from "./coverLetter.routes";
import { exportRouter } from "./export.routes";
import { healthRouter } from "./health.routes";
import { jobDescriptionRouter } from "./jobDescription.routes";
import { optimizeRouter } from "./optimize.routes";
import { resumeRouter } from "./resume.routes";

export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/resumes", resumeRouter);
router.use("/job-descriptions", jobDescriptionRouter);
router.use("/analysis", analysisRouter);
router.use("/optimize", optimizeRouter);
router.use("/export", exportRouter);
router.use("/cover-letters", coverLetterRouter);
router.use("/billing", billingRouter);
