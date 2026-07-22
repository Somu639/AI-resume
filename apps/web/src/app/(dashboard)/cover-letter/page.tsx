"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/motion";
import { apiFetch } from "@/lib/api";

type CoverLetterPayload = {
  greeting: string;
  body: string;
  closing: string;
};

/**
 * Cover letter generation — fact-bound to an existing resume + JD analysis.
 * Never invents experience beyond what the resume already states.
 */
export default function CoverLetterPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letter, setLetter] = useState<CoverLetterPayload | null>(null);
  const [resumeReady, setResumeReady] = useState(false);
  const [jdReady, setJdReady] = useState(false);

  useEffect(() => {
    setResumeReady(Boolean(sessionStorage.getItem("resumeai_resume_id")));
    setJdReady(Boolean(sessionStorage.getItem("resumeai_jd_analysis")));
  }, []);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const resumeId = sessionStorage.getItem("resumeai_resume_id");
      const jdRaw = sessionStorage.getItem("resumeai_jd_analysis");
      if (!resumeId || !jdRaw) {
        throw new Error(
          "Upload a resume and analyze a job description first."
        );
      }

      const resumeRes = await apiFetch<{
        data: { parsedJson: unknown };
      }>(`/resumes/${resumeId}`);

      const jobDescription = JSON.parse(jdRaw) as unknown;

      const res = await apiFetch<{
        data: { coverLetter: CoverLetterPayload };
      }>("/cover-letters", {
        method: "POST",
        body: JSON.stringify({
          resume: resumeRes.data.parsedJson,
          jobDescription,
        }),
      });

      setLetter(res.data.coverLetter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  const fullText = letter
    ? `${letter.greeting}\n\n${letter.body}\n\n${letter.closing}`
    : "";

  return (
    <div>
      <PageHeader
        title="Cover letter"
        description="Generate a tailored letter from your existing resume facts only."
        action={
          <Button asChild variant="outline">
            <Link href="/editor">Open resume editor</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Generate
            </CardTitle>
            <CardDescription>
              Uses your latest parsed resume and JD analysis from this session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Resume ready:{" "}
              <span className="font-medium text-foreground">
                {resumeReady ? "Yes" : "No — upload first"}
              </span>
            </p>
            <p>
              JD analysis ready:{" "}
              <span className="font-medium text-foreground">
                {jdReady ? "Yes" : "No — analyze a JD first"}
              </span>
            </p>
            {error ? <p className="text-destructive">{error}</p> : null}
            <Button
              className="w-full"
              onClick={generate}
              disabled={busy || !resumeReady || !jdReady}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate cover letter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draft</CardTitle>
            <CardDescription>
              Edit freely after generation — facts stay grounded in your resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[360px] font-serif text-[15px] leading-relaxed"
              value={fullText}
              onChange={(e) => {
                // Keep a single editable blob after generation
                if (!letter) return;
                setLetter({
                  greeting: letter.greeting,
                  body: e.target.value,
                  closing: "",
                });
              }}
              placeholder="Your cover letter will appear here…"
              readOnly={!letter}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
