import { Router } from "express";
import {
  deleteResumeHandler,
  getResumeHandler,
  getVersionHandler,
  listResumesHandler,
  listVersionsHandler,
  resumeUploadMiddleware,
  uploadResumeHandler,
} from "../controllers/resume.controller";
import { authMiddleware } from "../middleware/auth";

/** Resume upload, list, versions — all authenticated. */
export const resumeRouter = Router();

resumeRouter.use(authMiddleware);

resumeRouter.get("/", listResumesHandler);
resumeRouter.post("/", resumeUploadMiddleware, uploadResumeHandler);
resumeRouter.get("/:id", getResumeHandler);
resumeRouter.delete("/:id", deleteResumeHandler);
resumeRouter.get("/:id/versions", listVersionsHandler);
resumeRouter.get("/:id/versions/:versionId", getVersionHandler);
