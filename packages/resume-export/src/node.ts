import type { GenerateResumeDocumentOptions, GeneratedFile } from "./types";
import { generateResumePdf } from "./pdf/generatePdf";
import { generateResumeDocx } from "./docx/generateDocx";

/** Node/server entry — PDF + DOCX buffers (no DOM APIs). */
export async function generateResumeDocument(
  options: GenerateResumeDocumentOptions & { format: "pdf" | "docx" }
): Promise<GeneratedFile> {
  if (options.format === "pdf") {
    return generateResumePdf(options);
  }
  return generateResumeDocx(options);
}

export { generateResumePdf, generateResumePdfBlob } from "./pdf/generatePdf";
export { generateResumeDocx, generateResumeDocxBlob } from "./docx/generateDocx";
export { RESUME_THEMES, getTheme } from "./themes";
export type { ResumeTheme, ResumeThemeId } from "./themes";
export { SAMPLE_RESUME_JSON } from "./sample";
export type {
  ExportFormat,
  GenerateResumeDocumentOptions,
  GeneratedFile,
} from "./types";
