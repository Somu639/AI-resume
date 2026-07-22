import { z } from "zod";
import { resumeJsonSchema } from "../engines/resume-optimization/schema";
import { AppError } from "../middleware/errorHandler";

const exportRequestSchema = z.object({
  resume: resumeJsonSchema,
  theme: z
    .enum(["classic", "modern", "compact", "executive"])
    .default("classic"),
  format: z.enum(["pdf", "docx"]),
  fileName: z.string().optional(),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;

export const exportService = {
  async generate(input: unknown) {
    const parsed = exportRequestSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.errors[0]?.message ?? "Invalid export request"
      );
    }

    // Lazy-load so API cold start / health doesn't pull ESM-only @react-pdf/renderer
    const { generateResumeDocx, generateResumePdf } = await import(
      "@resumeai/resume-export"
    );

    const { resume, theme, format, fileName } = parsed.data;
    const options = {
      resume,
      theme,
      fileName,
    };

    try {
      if (format === "pdf") {
        return await generateResumePdf(options);
      }
      return await generateResumeDocx(options);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Export generation failed";
      throw new AppError(500, message);
    }
  },
};
