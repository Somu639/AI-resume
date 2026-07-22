import { Router } from "express";
import { scoreAtsHandler } from "../controllers/analysis.controller";
import { requireAuthOrService } from "../middleware/requireAuthOrService";

/**
 * ATS scoring is a local weighted algorithm (no LLM).
 * Keep it public so the editor can always score original vs optimized.
 */
export const analysisRouter = Router();

analysisRouter.post("/score", scoreAtsHandler);

analysisRouter.post("/", requireAuthOrService, (_req, res) => {
  res.status(501).json({
    message:
      "Not implemented: POST /analysis (persisted compare). Use POST /analysis/score.",
  });
});

analysisRouter.get("/", requireAuthOrService, (_req, res) => {
  res.status(501).json({ message: "Not implemented: GET /analysis" });
});

analysisRouter.get("/:id", requireAuthOrService, (_req, res) => {
  res.status(501).json({ message: "Not implemented: GET /analysis/:id" });
});
