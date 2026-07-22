"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadFile = {
  name: string;
  size: number;
  progress: number;
  status?: "uploading" | "done" | "error";
  error?: string;
};

export function FileDropzone({
  accept = ".pdf,.docx",
  onFiles,
  uploading = false,
  progress,
  className,
}: {
  accept?: string;
  onFiles?: (files: File[]) => void | Promise<void>;
  /** When true, show controlled progress from parent upload */
  uploading?: boolean;
  progress?: number;
  className?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);

  const handleFiles = useCallback(
    async (list: FileList | null) => {
      if (!list?.length) return;
      const next = Array.from(list);
      setFiles(
        next.map((f) => ({
          name: f.name,
          size: f.size,
          progress: 0,
          status: "uploading" as const,
        }))
      );

      if (onFiles) {
        try {
          await onFiles(next);
          setFiles((prev) =>
            prev.map((f) => ({ ...f, progress: 100, status: "done" }))
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Upload failed";
          setFiles((prev) =>
            prev.map((f) => ({
              ...f,
              progress: 100,
              status: "error",
              error: message,
            }))
          );
        }
        return;
      }

      // Demo-only animation when no upload handler is provided
      next.forEach((_, i) => {
        let p = 0;
        const id = window.setInterval(() => {
          p += 12;
          setFiles((prev) =>
            prev.map((file, idx) =>
              idx === i ? { ...file, progress: Math.min(p, 100) } : file
            )
          );
          if (p >= 100) window.clearInterval(id);
        }, 120);
      });
    },
    [onFiles]
  );

  const displayProgress =
    typeof progress === "number"
      ? progress
      : files[0]?.progress ?? (uploading ? 40 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        animate={{
          scale: dragging ? 1.01 : 1,
          borderColor: dragging
            ? "hsl(var(--primary))"
            : "hsl(var(--border))",
        }}
        className={cn(
          "relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center transition-colors",
          dragging && "bg-accent/40",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        <input
          type="file"
          accept={accept}
          disabled={uploading}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Upload className="h-5 w-5" />
        </div>
        <p className="font-medium">Drag & drop your resume</p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF or DOCX up to 10MB
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 pointer-events-none"
        >
          Browse files
        </Button>
      </motion.div>

      {files.map((file) => (
        <motion.div
          key={file.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB ·{" "}
                  {file.status === "error"
                    ? file.error
                    : `${Math.round(
                        onFiles ? displayProgress : file.progress
                      )}%`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setFiles((prev) => prev.filter((f) => f.name !== file.name))
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress
              value={onFiles ? displayProgress : file.progress}
              className={
                file.status === "error" ? "[&>div]:bg-destructive" : undefined
              }
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
