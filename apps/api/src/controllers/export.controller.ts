import type { NextFunction, Request, Response } from "express";
import { exportService } from "../services/export.service";

export async function exportResumeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const file = await exportService.generate(req.body);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    return res.status(200).send(file.buffer);
  } catch (error) {
    return next(error);
  }
}
