"use client";

import { useState } from "react";
import { Gauge, Loader2, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/shared/score-ring";
import { useLiveAtsScore } from "@/hooks/use-live-ats-score";
import { useEditorStore } from "@/store/editor-store";
import { apiFetch } from "@/lib/api";
import { htmlToPlainText } from "@/lib/editor/html";

type ManualScore = {
  atsScore: number;
  missingKeywords: string[];
  suggestions: string[];
  strengths: string[];
};

/**
 * Shows optimize before/after ATS plus a live score for the current
 * optimized editor content, with an explicit "Check ATS" action.
 */
export function LiveAtsPanel({ html }: { html: string }) {
  const atsSnapshot = useEditorStore((s) => s.atsSnapshot);
  const originalHtml = useEditorStore((s) => s.originalHtml);
  const job = useEditorStore((s) => s.job);
  const { data: live, isFetching, refetch, isError } = useLiveAtsScore(html);

  const [manual, setManual] = useState<ManualScore | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const display = manual ?? live;
  const delta =
    atsSnapshot != null
      ? atsSnapshot.afterAtsScore - atsSnapshot.beforeAtsScore
      : null;

  async function checkOptimizedAts() {
    if (!job) {
      setCheckError("Analyze a job description first.");
      return;
    }
    setBusy(true);
    setCheckError(null);
    try {
      const resumeText = htmlToPlainText(html);
      const originalText = htmlToPlainText(originalHtml);

      const [optimizedRes, originalRes] = await Promise.all([
        apiFetch<{ data: ManualScore }>("/analysis/score", {
          method: "POST",
          body: JSON.stringify({
            resume: { resumeText },
            job,
          }),
        }),
        originalText.length >= 40
          ? apiFetch<{ data: ManualScore }>("/analysis/score", {
              method: "POST",
              body: JSON.stringify({
                resume: { resumeText: originalText },
                job,
              }),
            })
          : Promise.resolve(null),
      ]);

      setManual({
        atsScore: optimizedRes.data.atsScore,
        missingKeywords: optimizedRes.data.missingKeywords ?? [],
        suggestions: optimizedRes.data.suggestions ?? [],
        strengths: optimizedRes.data.strengths ?? [],
      });

      // Keep snapshot in sync when user explicitly checks
      if (originalRes) {
        useEditorStore.setState({
          atsSnapshot: {
            beforeAtsScore: originalRes.data.atsScore,
            afterAtsScore: optimizedRes.data.atsScore,
            atsImprovementScore: Number(
              (optimizedRes.data.atsScore - originalRes.data.atsScore).toFixed(
                1
              )
            ),
            missingKeywords: optimizedRes.data.missingKeywords ?? [],
            strengths: optimizedRes.data.strengths ?? [],
            summary: atsSnapshot?.summary,
          },
        });
      }

      await refetch();
    } catch (err) {
      setCheckError(
        err instanceof Error ? err.message : "ATS check failed — try signing in again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          ATS score
          {isFetching || busy ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </CardTitle>
        <CardDescription>
          Compare original vs optimized against your JD
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {atsSnapshot ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="mb-2 text-xs text-muted-foreground">Original</p>
              <ScoreRing score={atsSnapshot.beforeAtsScore} label="Before" />
            </div>
            <div className="rounded-lg border border-primary/40 bg-accent/30 p-3 text-center">
              <p className="mb-2 text-xs text-muted-foreground">Optimized</p>
              <ScoreRing
                score={display?.atsScore ?? atsSnapshot.afterAtsScore}
                label="After"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <ScoreRing score={display?.atsScore ?? 0} label="ATS" />
          </div>
        )}

        {delta != null ? (
          <p className="text-center text-sm">
            Change:{" "}
            <span
              className={
                delta >= 0 ? "font-medium text-success" : "font-medium text-destructive"
              }
            >
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)} pts
            </span>
          </p>
        ) : null}

        <Button
          className="w-full"
          variant="secondary"
          disabled={busy || !job}
          onClick={() => void checkOptimizedAts()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Check ATS of optimized resume
        </Button>

        {checkError ? (
          <p className="text-xs text-destructive">{checkError}</p>
        ) : null}
        {isError && !manual ? (
          <p className="text-xs text-muted-foreground">
            Live API score unavailable — showing local estimate until you click
            Check ATS.
          </p>
        ) : null}

        {atsSnapshot?.summary ? (
          <p className="text-sm text-muted-foreground">{atsSnapshot.summary}</p>
        ) : null}

        {display?.missingKeywords?.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">Still missing</p>
            <div className="flex flex-wrap gap-1.5">
              {display.missingKeywords.slice(0, 8).map((k) => (
                <Badge key={k} variant="warning">
                  {k}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No major missing keywords detected for this JD.
          </p>
        )}

        {display?.suggestions?.[0] ? (
          <p className="text-sm text-muted-foreground">{display.suggestions[0]}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
