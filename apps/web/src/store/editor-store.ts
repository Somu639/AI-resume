"use client";

import { create } from "zustand";
import type { ResumeJsonLike } from "@/lib/editor/resume-html";
import type { EditorChange, EditorVersion } from "@/lib/editor/types";

const MAX_HISTORY = 50;

export type JobTarget = {
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  responsibilities: string[];
  keywords: string[];
  seniority: string;
  experience: string;
};

export type AtsSnapshot = {
  beforeAtsScore: number;
  afterAtsScore: number;
  atsImprovementScore: number;
  missingKeywords: string[];
  strengths: string[];
  summary?: string;
};

type EditorStore = {
  originalHtml: string;
  workingHtml: string;
  changes: EditorChange[];
  versions: EditorVersion[];
  activeVersionId: string;
  past: string[];
  future: string[];
  resumeId: string | null;
  job: JobTarget | null;
  originalResume: ResumeJsonLike | null;
  optimizedResume: ResumeJsonLike | null;
  atsSnapshot: AtsSnapshot | null;
  status: "idle" | "loading" | "ready" | "error";
  isReoptimizing: boolean;
  error: string | null;
  setWorkingHtml: (html: string, recordHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  acceptChange: (id: string) => void;
  rejectChange: (id: string) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  saveVersion: (label: string, source?: EditorVersion["source"]) => void;
  restoreVersion: (id: string) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  hydrateOptimization: (input: {
    resumeId?: string | null;
    job: JobTarget;
    originalHtml: string;
    optimizedHtml: string;
    originalResume: ResumeJsonLike;
    optimizedResume: ResumeJsonLike;
    changes: EditorChange[];
    atsSnapshot?: AtsSnapshot | null;
  }) => void;
  setStatus: (
    status: EditorStore["status"],
    error?: string | null
  ) => void;
  setReoptimizing: (value: boolean) => void;
};

function applyRejectToHtml(html: string, change: EditorChange): string {
  if (change.type === "modified" && change.before && change.after) {
    return html.includes(change.after)
      ? html.replace(change.after, change.before)
      : html;
  }
  if (change.type === "added" && change.after) {
    const escaped = change.after.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return html
      .replace(new RegExp(`<li>\\s*${escaped}\\s*</li>`, "i"), "")
      .replace(change.after, "");
  }
  return html;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  originalHtml: "",
  workingHtml: "",
  changes: [],
  versions: [],
  activeVersionId: "",
  past: [],
  future: [],
  resumeId: null,
  job: null,
  originalResume: null,
  optimizedResume: null,
  atsSnapshot: null,
  status: "idle",
  isReoptimizing: false,
  error: null,

  setWorkingHtml: (html, recordHistory = true) => {
    const { workingHtml, past } = get();
    if (html === workingHtml) return;
    if (recordHistory) {
      set({
        workingHtml: html,
        past: [...past.slice(-(MAX_HISTORY - 1)), workingHtml],
        future: [],
      });
    } else {
      set({ workingHtml: html });
    }
  },

  undo: () => {
    const { past, workingHtml, future } = get();
    if (!past.length) return;
    const previous = past[past.length - 1]!;
    set({
      workingHtml: previous,
      past: past.slice(0, -1),
      future: [workingHtml, ...future].slice(0, MAX_HISTORY),
    });
  },

  redo: () => {
    const { past, workingHtml, future } = get();
    if (!future.length) return;
    const next = future[0]!;
    set({
      workingHtml: next,
      past: [...past, workingHtml].slice(-MAX_HISTORY),
      future: future.slice(1),
    });
  },

  acceptChange: (id) => {
    const { changes } = get();
    const change = changes.find((c) => c.id === id);
    if (!change || change.status !== "pending") return;
    set({
      changes: changes.map((c) =>
        c.id === id ? { ...c, status: "accepted" } : c
      ),
    });
  },

  rejectChange: (id) => {
    const { changes, workingHtml, past } = get();
    const change = changes.find((c) => c.id === id);
    if (!change || change.status !== "pending") return;
    const nextHtml = applyRejectToHtml(workingHtml, change);
    set({
      changes: changes.map((c) =>
        c.id === id ? { ...c, status: "rejected" } : c
      ),
      workingHtml: nextHtml,
      past: [...past.slice(-(MAX_HISTORY - 1)), workingHtml],
      future: [],
    });
  },

  acceptAll: () => {
    set({
      changes: get().changes.map((c) =>
        c.status === "pending" ? { ...c, status: "accepted" } : c
      ),
    });
  },

  rejectAll: () => {
    const { changes, workingHtml, past } = get();
    let html = workingHtml;
    for (const change of changes) {
      if (change.status === "pending") html = applyRejectToHtml(html, change);
    }
    set({
      changes: changes.map((c) =>
        c.status === "pending" ? { ...c, status: "rejected" } : c
      ),
      workingHtml: html,
      past: [...past.slice(-(MAX_HISTORY - 1)), workingHtml],
      future: [],
    });
  },

  saveVersion: (label, source = "manual") => {
    const { workingHtml, versions } = get();
    const id = `v${versions.length + 1}-${Date.now()}`;
    const version: EditorVersion = {
      id,
      label,
      html: workingHtml,
      createdAt: new Date().toISOString(),
      source,
    };
    set({
      versions: [version, ...versions],
      activeVersionId: id,
    });
  },

  restoreVersion: (id) => {
    const { versions, workingHtml, past } = get();
    const version = versions.find((v) => v.id === id);
    if (!version) return;
    set({
      workingHtml: version.html,
      activeVersionId: id,
      past: [...past.slice(-(MAX_HISTORY - 1)), workingHtml],
      future: [],
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  hydrateOptimization: ({
    resumeId,
    job,
    originalHtml,
    optimizedHtml,
    originalResume,
    optimizedResume,
    changes,
    atsSnapshot = null,
  }) => {
    const originalVersion: EditorVersion = {
      id: "v-original",
      label: "Original upload",
      html: originalHtml,
      createdAt: new Date().toISOString(),
      source: "original",
    };
    const aiVersion: EditorVersion = {
      id: `v-ai-${Date.now()}`,
      label: "AI optimize · your JD",
      html: optimizedHtml,
      createdAt: new Date().toISOString(),
      source: "ai",
    };
    set({
      resumeId: resumeId ?? null,
      job,
      originalHtml,
      workingHtml: optimizedHtml,
      originalResume,
      optimizedResume,
      atsSnapshot,
      changes,
      versions: [aiVersion, originalVersion],
      activeVersionId: aiVersion.id,
      past: [],
      future: [],
      status: "ready",
      isReoptimizing: false,
      error: null,
    });
  },

  setStatus: (status, error = null) => set({ status, error }),
  setReoptimizing: (value) => set({ isReoptimizing: value }),
}));
