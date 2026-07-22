import type { ResumeJson } from "@resumeai/shared";
import type { ResumeThemeId } from "./themes";

export type ExportFormat = "pdf" | "docx";

export type GenerateResumeDocumentOptions = {
  resume: ResumeJson;
  theme?: ResumeThemeId;
  fileName?: string;
};

export type GeneratedFile = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

export function assertResume(resume: ResumeJson): void {
  if (!resume?.personalInfo?.name?.trim()) {
    throw new Error("Resume must include personalInfo.name");
  }
}
