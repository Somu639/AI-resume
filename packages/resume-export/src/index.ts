export { RESUME_THEMES, getTheme } from "./themes";
export type { ResumeTheme, ResumeThemeId } from "./themes";

export { BASE_SPACING, getSpacing } from "./spacing";

export { generateResumePdf, generateResumePdfBlob } from "./pdf/generatePdf";
export { ResumePdfDocument } from "./pdf/ResumeDocument";
export { generateResumeDocx, generateResumeDocxBlob } from "./docx/generateDocx";
export { generateResumeDocument } from "./node";

export { SAMPLE_RESUME_JSON } from "./sample";

export type {
  ExportFormat,
  GenerateResumeDocumentOptions,
  GeneratedFile,
} from "./types";
