"use client";

import {
  RESUME_THEMES,
  generateResumeDocxBlob,
  generateResumePdfBlob,
  type ResumeThemeId,
} from "@resumeai/resume-export";
import { downloadBlob } from "@resumeai/resume-export/browser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

export function ExportPanel() {
  const optimizedResume = useEditorStore((s) => s.optimizedResume);
  const originalResume = useEditorStore((s) => s.originalResume);
  const [theme, setTheme] = useState<ResumeThemeId>("modern");
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resume = optimizedResume ?? originalResume;

  async function exportFile(format: "pdf" | "docx") {
    if (!resume) {
      setError("Optimize a resume before exporting.");
      return;
    }
    setBusy(format);
    setError(null);
    try {
      const options = {
        resume: resume as never,
        theme,
        fileName: resume.personalInfo.name || "resume",
      };
      if (format === "pdf") {
        const blob = await generateResumePdfBlob(options);
        downloadBlob(blob, `${options.fileName}-${theme}.pdf`);
      } else {
        const blob = await generateResumeDocxBlob(options);
        downloadBlob(blob, `${options.fileName}-${theme}.docx`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Export resume
        </CardTitle>
        <CardDescription>
          ATS-friendly one-column templates · PDF & DOCX
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(RESUME_THEMES) as ResumeThemeId[]).map((id) => {
            const item = RESUME_THEMES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-colors",
                  theme === id
                    ? "border-primary bg-accent/50"
                    : "border-border hover:bg-accent/40"
                )}
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!!busy || !resume}
            onClick={() => void exportFile("pdf")}
          >
            {busy === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            className="flex-1"
            variant="secondary"
            disabled={!!busy || !resume}
            onClick={() => void exportFile("docx")}
          >
            {busy === "docx" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            DOCX
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
