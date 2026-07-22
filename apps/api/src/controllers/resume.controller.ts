import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { FILE_LIMITS } from "@resumeai/shared";
import { AppError } from "../middleware/errorHandler";
import { resumeService } from "../services/resume.service";
import { param } from "../utils/params";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_LIMITS.maxBytes },
  fileFilter: (_req, file, cb) => {
    if (FILE_LIMITS.allowedMimeTypes.includes(file.mimetype as never)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
});

export const resumeUploadMiddleware = upload.single("file");

export async function listResumesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await resumeService.list(req.user!.id);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function uploadResumeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) throw new AppError(400, "file is required");
    const title =
      typeof req.body?.title === "string" ? req.body.title : undefined;
    const data = await resumeService.upload(req.user!.id, req.file, title);
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function getResumeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await resumeService.getById(req.user!.id, param(req.params.id));
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function deleteResumeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await resumeService.softDelete(req.user!.id, param(req.params.id));
    return res.json({ data: { ok: true } });
  } catch (error) {
    return next(error);
  }
}

export async function listVersionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await resumeService.getVersions(
      req.user!.id,
      param(req.params.id)
    );
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function getVersionHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await resumeService.getVersion(
      req.user!.id,
      param(req.params.id),
      param(req.params.versionId)
    );
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}
