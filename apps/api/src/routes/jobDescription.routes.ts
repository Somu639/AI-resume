import { Router } from "express";
import { analyzeJobDescriptionHandler } from "../controllers/jobDescription.controller";
import { authMiddleware } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/rateLimiter";
import { requireAuthOrService } from "../middleware/requireAuthOrService";

/** Job descriptions + OpenAI classification. */
export const jobDescriptionRouter = Router();

jobDescriptionRouter.post(
  "/analyze",
  requireAuthOrService,
  aiRateLimiter,
  analyzeJobDescriptionHandler
);

jobDescriptionRouter.get("/", authMiddleware, (_req, res) => {
  res.status(501).json({ message: "Not implemented: GET /job-descriptions" });
});

jobDescriptionRouter.post("/", authMiddleware, (_req, res) => {
  res.status(501).json({ message: "Not implemented: POST /job-descriptions" });
});

jobDescriptionRouter.get("/:id", authMiddleware, (_req, res) => {
  res.status(501).json({ message: "Not implemented: GET /job-descriptions/:id" });
});

jobDescriptionRouter.delete("/:id", authMiddleware, (_req, res) => {
  res.status(501).json({ message: "Not implemented: DELETE /job-descriptions/:id" });
});

jobDescriptionRouter.post(
  "/:id/extract-keywords",
  requireAuthOrService,
  aiRateLimiter,
  async (req, res, next) => {
    try {
      if (
        typeof req.body?.jobDescription === "string" ||
        typeof req.body?.text === "string"
      ) {
        return analyzeJobDescriptionHandler(req, res, next);
      }
      return res.status(501).json({
        message: "Pass { jobDescription } to POST /job-descriptions/analyze.",
      });
    } catch (error) {
      return next(error);
    }
  }
);
