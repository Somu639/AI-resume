import { Router } from "express";
import { exportResumeHandler } from "../controllers/export.controller";
import { requireAuthOrService } from "../middleware/requireAuthOrService";

/** Resume PDF / DOCX export. */
export const exportRouter = Router();

exportRouter.post("/", requireAuthOrService, exportResumeHandler);
