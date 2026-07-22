/** Browser helpers for client-side downloads. */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function bufferToBlob(
  buffer: ArrayBuffer | Uint8Array,
  mimeType: string
): Blob {
  const bytes =
    buffer instanceof Uint8Array
      ? buffer
      : new Uint8Array(buffer);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: mimeType });
}

export {
  generateResumePdfBlob,
} from "./pdf/generatePdf";
export {
  generateResumeDocxBlob,
} from "./docx/generateDocx";
export { RESUME_THEMES, getTheme } from "./themes";
export type { ResumeThemeId } from "./themes";
export { SAMPLE_RESUME_JSON } from "./sample";
