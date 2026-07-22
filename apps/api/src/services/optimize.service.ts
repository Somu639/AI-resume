import {
  optimizeResume,
  type OptimizeResumeRequest,
  type OptimizeResumeResult,
} from "../engines/resume-optimization";
import { prisma } from "../lib/prisma";
import { exportService } from "./export.service";
import { resumeService } from "./resume.service";

/**
 * Optimize service — AI rewrite, optional version persistence, PDF/DOCX export.
 * Persistence never invents content; it stores the optimizer's validated output.
 */
export const optimizeService = {
  async optimize(
    input: OptimizeResumeRequest,
    userId?: string
  ): Promise<OptimizeResumeResult & { versionId?: string }> {
    const result = await optimizeResume(input);

    let versionId: string | undefined;
    if (userId && input.resumeId) {
      const version = await resumeService.addOptimizedVersion({
        userId,
        resumeId: input.resumeId,
        contentText: JSON.stringify(result.optimizedResume, null, 2),
        contentJson: result.optimizedResume,
        changesJson: {
          modifications: result.modifications,
          atsImprovementScore: result.atsImprovementScore,
          beforeAtsScore: result.beforeAtsScore,
          afterAtsScore: result.afterAtsScore,
        },
      });
      versionId = version.id;

      // Keep Resume.parsedJson aligned with latest optimized content
      await prisma.resume.update({
        where: { id: input.resumeId },
        data: { parsedJson: result.optimizedResume },
      });

      await prisma.usageEvent.create({
        data: {
          userId,
          type: "ai_optimize",
          metaJson: {
            resumeId: input.resumeId,
            versionId,
            atsDelta: result.atsImprovementScore,
          },
        },
      });
    }

    return { ...result, versionId };
  },

  async generate(_analysisId: string, _userId: string) {
    throw new Error(
      "Not implemented: optimizeService.generate (persist analysis id first). Use optimize() for live runs."
    );
  },

  async export(input: {
    resume: OptimizeResumeRequest["resume"];
    theme?: "classic" | "modern" | "compact" | "executive";
    formats: Array<"pdf" | "docx">;
    fileName?: string;
  }) {
    const files = [];
    for (const format of input.formats) {
      files.push(
        await exportService.generate({
          resume: input.resume,
          theme: input.theme ?? "classic",
          format,
          fileName: input.fileName,
        })
      );
    }
    return files;
  },
};
