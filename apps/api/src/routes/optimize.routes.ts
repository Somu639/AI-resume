import { Router } from "express";
import { optimizeResumeHandler } from "../controllers/optimize.controller";
import { requireAuthOrService } from "../middleware/requireAuthOrService";
import { aiRateLimiter } from "../middleware/rateLimiter";

/** AI optimize — JWT user or service API key. */
export const optimizeRouter = Router();

optimizeRouter.post("/", requireAuthOrService, aiRateLimiter, optimizeResumeHandler);

optimizeRouter.get("/:id", requireAuthOrService, (_req, res) => {
  res.status(501).json({ message: "Not implemented: GET /optimize/:id" });
});

optimizeRouter.post("/:id/export", requireAuthOrService, (_req, res) => {
  res.status(501).json({ message: "Not implemented: POST /optimize/:id/export" });
});
