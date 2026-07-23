"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  prepareResumeForOptimize,
  resumeJsonToHtml,
  type ResumeJsonLike,
} from "@/lib/editor/resume-html";
import type { EditorChange } from "@/lib/editor/types";
import {
  useEditorStore,
  type AtsSnapshot,
  type JobTarget,
} from "@/store/editor-store";

type OptimizeApiResponse = {
  data: {
    optimizedResume: ResumeJsonLike;
    modifications: Array<{
      type: "added" | "removed" | "modified";
      section: string;
      before?: string;
      after?: string;
      reason?: string;
    }>;
    beforeAtsScore?: number;
    afterAtsScore?: number;
    atsImprovementScore?: number;
    missingKeywords?: string[];
    atsAnalysis?: {
      summary?: string;
      strengths?: string[];
    };
  };
};

function readJobFromSession(): JobTarget | null {
  try {
    const raw = sessionStorage.getItem("resumeai_jd_analysis");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JobTarget;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      requiredSkills: parsed.requiredSkills ?? [],
      preferredSkills: parsed.preferredSkills ?? [],
      tools: parsed.tools ?? [],
      responsibilities: parsed.responsibilities ?? [],
      keywords: parsed.keywords ?? [],
      seniority: parsed.seniority ?? "",
      experience: parsed.experience ?? "",
    };
  } catch {
    return null;
  }
}

function mapModifications(
  mods: OptimizeApiResponse["data"]["modifications"]
): EditorChange[] {
  return mods.map((m, i) => ({
    id: `m-${i}-${Date.now()}-${m.section}-${m.type}`,
    section: m.section || "General",
    type: m.type,
    before: m.before,
    after: m.after,
    reason: m.reason,
    status: "pending" as const,
  }));
}

/**
 * Loads the user's resume + JD analysis, then runs /optimize
 * so the editor shows real, JD-relevant edit suggestions.
 */
export function useEditorSession() {
  const searchParams = useSearchParams();
  const hydrateOptimization = useEditorStore((s) => s.hydrateOptimization);
  const setStatus = useEditorStore((s) => s.setStatus);
  const setReoptimizing = useEditorStore((s) => s.setReoptimizing);
  const status = useEditorStore((s) => s.status);
  const error = useEditorStore((s) => s.error);
  const isReoptimizing = useEditorStore((s) => s.isReoptimizing);
  const initialRan = useRef(false);

  const runOptimize = useCallback(
    async (options?: { force?: boolean }) => {
      const force = Boolean(options?.force);
      const resumeId =
        searchParams.get("resumeId") ||
        sessionStorage.getItem("resumeai_resume_id");
      const job = readJobFromSession();

      if (!resumeId) {
        setStatus(
          "needs_input",
          "Upload a resume first, then analyze a job description."
        );
        return;
      }
      if (!job) {
        setStatus(
          "needs_input",
          "Analyze a job description first so edits match that JD."
        );
        return;
      }

      const alreadyReady = useEditorStore.getState().status === "ready";

      // Prevent React Strict Mode / remount from firing duplicate auto-runs
      if (!force && initialRan.current) return;
      if (!force) initialRan.current = true;

      if (alreadyReady && force) {
        setReoptimizing(true);
      } else if (!alreadyReady) {
        setStatus("loading");
      } else if (force) {
        setReoptimizing(true);
      }

      try {
        const resumeRes = await apiFetch<{
          data: { id: string; parsedJson: ResumeJsonLike | null };
        }>(`/resumes/${resumeId}`);

        if (!resumeRes.data.parsedJson) {
          throw new Error("Resume has no parsed content yet.");
        }

        const originalResume = prepareResumeForOptimize(
          resumeRes.data.parsedJson
        );
        sessionStorage.setItem("resumeai_resume_id", resumeId);

        const optimizeRes = await apiFetch<OptimizeApiResponse>("/optimize", {
          method: "POST",
          body: JSON.stringify({
            resume: originalResume,
            jobDescription: job,
            resumeId,
          }),
        });

        const optimizedResume = prepareResumeForOptimize(
          optimizeRes.data.optimizedResume
        );
        const originalHtml = resumeJsonToHtml(originalResume);
        const optimizedHtml = resumeJsonToHtml(optimizedResume);
        const changes = mapModifications(optimizeRes.data.modifications);

        const before = Number(optimizeRes.data.beforeAtsScore ?? 0);
        const after = Number(optimizeRes.data.afterAtsScore ?? 0);
        const atsSnapshot: AtsSnapshot = {
          beforeAtsScore: before,
          afterAtsScore: after,
          atsImprovementScore: Number(
            optimizeRes.data.atsImprovementScore ?? after - before
          ),
          missingKeywords: optimizeRes.data.missingKeywords ?? [],
          strengths: optimizeRes.data.atsAnalysis?.strengths ?? [],
          summary: optimizeRes.data.atsAnalysis?.summary,
        };

        hydrateOptimization({
          resumeId,
          job,
          originalHtml,
          optimizedHtml,
          originalResume,
          optimizedResume,
          atsSnapshot,
          changes:
            changes.length > 0
              ? changes
              : [
                  {
                    id: `noop-${Date.now()}`,
                    section: "General",
                    type: "modified",
                    before: "No material rewrites suggested for this JD.",
                    after:
                      "Your resume already aligns closely — tweak wording manually if needed.",
                    status: "pending",
                  },
                ],
        });
        initialRan.current = true;
      } catch (err) {
        setReoptimizing(false);
        setStatus(
          "error",
          err instanceof Error ? err.message : "Failed to optimize resume"
        );
      }
    },
    [hydrateOptimization, searchParams, setReoptimizing, setStatus]
  );

  useEffect(() => {
    void runOptimize({ force: false });
  }, [runOptimize]);

  const rerun = useCallback(() => runOptimize({ force: true }), [runOptimize]);

  return { status, error, isReoptimizing, rerun };
}
