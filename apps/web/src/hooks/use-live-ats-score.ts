"use client";

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { htmlToPlainText } from "@/lib/editor/html";
import type { AtsLiveResult } from "@/lib/editor/types";
import { useEditorStore, type JobTarget } from "@/store/editor-store";

type ScoreApiResponse = {
  data: {
    atsScore: number;
    missingKeywords: string[];
    suggestions: string[];
    strengths: string[];
  };
};

function localAtsFallback(text: string, job: JobTarget | null): AtsLiveResult {
  const haystack = text.toLowerCase();
  const keywords = job
    ? [
        ...job.keywords,
        ...job.requiredSkills,
        ...job.tools,
        ...job.preferredSkills,
      ]
    : [];
  const unique = Array.from(new Set(keywords.map((k) => k.trim()).filter(Boolean)));
  const missing = unique.filter((k) => !haystack.includes(k.toLowerCase()));
  const matched = unique.length - missing.length;
  const coverage = unique.length ? matched / unique.length : 0.5;
  const hasEmail = /@/.test(text);
  const hasBullets = /- |•/.test(text) || text.includes("\n");
  const formatting = (hasEmail ? 40 : 10) + (hasBullets ? 40 : 10) + 20;
  const atsScore = Math.round(coverage * 70 + (formatting / 100) * 30);

  return {
    atsScore: Math.min(100, atsScore),
    missingKeywords: missing.slice(0, 8),
    suggestions: missing.length
      ? [`Consider weaving in: ${missing.slice(0, 3).join(", ")}.`]
      : ["Keyword coverage looks solid for this JD."],
    strengths: matched > 0 ? [`Matched ${matched} target keywords.`] : [],
  };
}

async function fetchAtsScore(
  resumeText: string,
  job: JobTarget | null
): Promise<AtsLiveResult> {
  if (!job) return localAtsFallback(resumeText, null);
  try {
    const res = await apiFetch<ScoreApiResponse>("/analysis/score", {
      method: "POST",
      body: JSON.stringify({
        resume: { resumeText },
        job,
      }),
    });
    return {
      atsScore: res.data.atsScore,
      missingKeywords: res.data.missingKeywords ?? [],
      suggestions: res.data.suggestions ?? [],
      strengths: res.data.strengths ?? [],
    };
  } catch {
    return localAtsFallback(resumeText, job);
  }
}

export function useLiveAtsScore(html: string) {
  const job = useEditorStore((s) => s.job);
  const deferredHtml = useDeferredValue(html);
  const plainText = useMemo(
    () => htmlToPlainText(deferredHtml),
    [deferredHtml]
  );

  return useQuery({
    queryKey: [
      "ats-score",
      plainText.slice(0, 4000),
      job?.requiredSkills?.slice(0, 5) ?? [],
      job?.keywords?.slice(0, 5) ?? [],
    ],
    queryFn: () => fetchAtsScore(plainText, job),
    enabled: plainText.length >= 40,
    placeholderData: (prev) => prev,
  });
}
