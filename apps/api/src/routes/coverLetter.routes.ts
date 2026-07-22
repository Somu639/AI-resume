import { Router } from "express";
import {
  createCoverLetterHandler,
  getCoverLetterHandler,
} from "../controllers/coverLetter.controller";
import { authMiddleware } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/rateLimiter";

export const coverLetterRouter = Router();

coverLetterRouter.use(authMiddleware);
coverLetterRouter.post("/", aiRateLimiter, createCoverLetterHandler);
coverLetterRouter.get("/:id", getCoverLetterHandler);
