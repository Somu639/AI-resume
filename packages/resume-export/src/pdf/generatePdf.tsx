import React from "react";
import { pdf } from "@react-pdf/renderer";
import { ResumePdfDocument } from "./ResumeDocument";
import {
  assertResume,
  type GenerateResumeDocumentOptions,
  type GeneratedFile,
} from "../types";
import { safeFileStem } from "../utils/format";

async function toNodeBuffer(
  data: Blob | ArrayBuffer | Uint8Array | Buffer
): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (data instanceof Uint8Array) return Buffer.from(data);
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}

/** Generate an ATS-friendly PDF buffer from resume JSON. */
export async function generateResumePdf(
  options: GenerateResumeDocumentOptions
): Promise<GeneratedFile> {
  assertResume(options.resume);
  const theme = options.theme ?? "classic";
  const stem = safeFileStem(options.fileName ?? options.resume.personalInfo.name);

  const instance = pdf(
    <ResumePdfDocument resume={options.resume} themeId={theme} />
  );

  const blob = await instance.toBlob();
  const buffer = await toNodeBuffer(blob);

  return {
    filename: `${stem}-${theme}.pdf`,
    mimeType: "application/pdf",
    buffer,
  };
}

/** Browser helper: returns a Blob for download. */
export async function generateResumePdfBlob(
  options: GenerateResumeDocumentOptions
): Promise<Blob> {
  assertResume(options.resume);
  const theme = options.theme ?? "classic";
  return pdf(
    <ResumePdfDocument resume={options.resume} themeId={theme} />
  ).toBlob();
}
