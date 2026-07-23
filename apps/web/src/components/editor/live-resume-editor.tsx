"use client";

import Link from "next/link";
import { Columns2, Loader2, Redo2, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/motion";
import { TipTapEditor } from "@/components/editor/tip-tap-editor";
import { ChangeReviewPanel } from "@/components/editor/change-review-panel";
import { VersionHistoryPanel } from "@/components/editor/version-history-panel";
import { LiveAtsPanel } from "@/components/editor/live-ats-panel";
import { ExportPanel } from "@/components/editor/export-panel";
import { useEditorStore } from "@/store/editor-store";
import { useEditorSession } from "@/hooks/use-editor-session";

export function LiveResumeEditor() {
  const { status, error, isReoptimizing, rerun } = useEditorSession();
  const originalHtml = useEditorStore((s) => s.originalHtml);
  const workingHtml = useEditorStore((s) => s.workingHtml);
  const setWorkingHtml = useEditorStore((s) => s.setWorkingHtml);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const saveVersion = useEditorStore((s) => s.saveVersion);
  const job = useEditorStore((s) => s.job);
  const atsSnapshot = useEditorStore((s) => s.atsSnapshot);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-medium">Optimizing your resume for this JD…</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Generating relevant edits from your uploaded content only — no invented
          experience.
        </p>
      </div>
    );
  }

  if (status === "needs_input") {
    const needsJd = Boolean(error && error.toLowerCase().includes("job description first"));
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium">Let’s set up your optimization</p>
        <p className="text-sm text-muted-foreground">
          {error ?? "Upload a resume and analyze a job description to get started."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {needsJd ? (
            <Button asChild>
              <Link href="/analyze">Analyze JD</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/upload">Upload resume</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/resumes">My resumes</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <p className="font-medium text-destructive">Editor couldn’t load edits</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/upload">Upload resume</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/analyze">Analyze JD</Link>
          </Button>
          <Button onClick={() => void rerun()}>
            <Sparkles className="h-4 w-4" />
            Retry optimize
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isReoptimizing ? (
        <div className="absolute inset-0 z-20 flex items-start justify-center rounded-xl bg-background/70 pt-24 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Re-optimizing against your JD…</span>
          </div>
        </div>
      ) : null}

      <PageHeader
        title="Live resume editor"
        description={
          job
            ? `Edits tailored to this JD · ${
                [job.seniority, job.experience].filter(Boolean).join(" · ") ||
                "matched skills & keywords"
              }`
            : "Compare original vs optimized, accept AI changes, and export."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!past.length || isReoptimizing}
              onClick={undo}
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!future.length || isReoptimizing}
              onClick={redo}
            >
              <Redo2 className="h-4 w-4" />
              Redo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isReoptimizing}
              onClick={() => saveVersion("Checkpoint before export")}
            >
              Save version
            </Button>
            <Button
              size="sm"
              disabled={isReoptimizing}
              onClick={() => void rerun()}
            >
              {isReoptimizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Re-optimize
            </Button>
          </div>
        }
      />

      {atsSnapshot ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">ATS</span>
          <span>
            Original <strong>{Math.round(atsSnapshot.beforeAtsScore)}</strong>
          </span>
          <span aria-hidden>→</span>
          <span>
            Optimized <strong>{Math.round(atsSnapshot.afterAtsScore)}</strong>
          </span>
          <span
            className={
              atsSnapshot.atsImprovementScore >= 0
                ? "text-success"
                : "text-destructive"
            }
          >
            ({atsSnapshot.atsImprovementScore >= 0 ? "+" : ""}
            {atsSnapshot.atsImprovementScore.toFixed(1)})
          </span>
        </div>
      ) : null}

      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Columns2 className="h-4 w-4" />
        Side-by-side comparison · original is read-only · suggestions match your JD
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Original</p>
          <TipTapEditor
            content={originalHtml}
            onChange={() => undefined}
            editable={false}
            showToolbar={false}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Optimized (editable)</p>
          <TipTapEditor
            content={workingHtml}
            onChange={(html) => setWorkingHtml(html, false)}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ChangeReviewPanel />
        <div className="space-y-6">
          <LiveAtsPanel html={workingHtml} />
          <ExportPanel />
          <VersionHistoryPanel />
        </div>
      </div>
    </div>
  );
}
