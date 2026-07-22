import { randomUUID } from "crypto";
import { FILE_LIMITS } from "@resumeai/shared";
import { parseResumeBuffer } from "../engines/resume-parser";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { s3Service } from "./s3.service";

/**
 * Resume upload + version history service.
 * Parses PDF/DOCX, stores original in S3, and creates version v1.
 */
export const resumeService = {
  async upload(userId: string, file: Express.Multer.File, title?: string) {
    if (!FILE_LIMITS.allowedMimeTypes.includes(file.mimetype as never)) {
      throw new AppError(415, "Only PDF and DOCX files are allowed");
    }
    if (file.size > FILE_LIMITS.maxBytes) {
      throw new AppError(413, "File exceeds 10MB limit");
    }

    const resumeId = randomUUID();
    const ext = file.originalname.toLowerCase().endsWith(".docx")
      ? "docx"
      : "pdf";
    const s3Key = `users/${userId}/resumes/${resumeId}/original.${ext}`;

    let parsed;
    try {
      parsed = await parseResumeBuffer(file.buffer, file.mimetype);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(422, "Failed to parse resume", "PARSE_FAILED");
    }

    await s3Service.upload({
      key: s3Key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const resume = await prisma.resume.create({
      data: {
        id: resumeId,
        userId,
        title:
          title?.trim() ||
          parsed.parsed.personalInfo.name ||
          file.originalname.replace(/\.[^.]+$/, ""),
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        s3Key,
        extractedText: parsed.text,
        parsedJson: parsed.parsed,
        status: "ready",
        versions: {
          create: {
            versionNumber: 1,
            label: "Original upload",
            contentText: parsed.text,
            contentJson: parsed.parsed,
            source: "upload",
          },
        },
      },
      include: { versions: true },
    });

    await prisma.usageEvent.create({
      data: { userId, type: "resume_upload", metaJson: { resumeId } },
    });

    return resume;
  },

  async list(userId: string) {
    return prisma.resume.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        _count: { select: { versions: true, analyses: true } },
      },
    });
  },

  async getById(userId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
      },
    });
    if (!resume) throw new AppError(404, "Resume not found");
    return resume;
  },

  async softDelete(userId: string, resumeId: string) {
    await this.getById(userId, resumeId);
    return prisma.resume.update({
      where: { id: resumeId },
      data: { deletedAt: new Date() },
    });
  },

  async getVersions(userId: string, resumeId: string) {
    await this.getById(userId, resumeId);
    return prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: "desc" },
    });
  },

  async getVersion(userId: string, resumeId: string, versionId: string) {
    await this.getById(userId, resumeId);
    const version = await prisma.resumeVersion.findFirst({
      where: { id: versionId, resumeId },
    });
    if (!version) throw new AppError(404, "Version not found");
    return version;
  },

  /**
   * Persist an AI-optimized snapshot as a new version (never invents content —
   * caller must supply already-validated optimized JSON/text).
   */
  async addOptimizedVersion(input: {
    userId: string;
    resumeId: string;
    contentText: string;
    contentJson: unknown;
    changesJson?: unknown;
    label?: string;
  }) {
    const resume = await this.getById(input.userId, input.resumeId);
    const latest = resume.versions[0];
    const versionNumber = (latest?.versionNumber ?? 0) + 1;

    return prisma.resumeVersion.create({
      data: {
        resumeId: input.resumeId,
        parentVersionId: latest?.id,
        versionNumber,
        label: input.label ?? `AI optimize v${versionNumber}`,
        contentText: input.contentText,
        contentJson: input.contentJson as object,
        changesJson: (input.changesJson as object) ?? undefined,
        source: "ai_optimize",
      },
    });
  },
};
