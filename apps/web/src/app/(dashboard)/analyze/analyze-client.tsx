"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/motion";
import { Stepper } from "@/components/shared/stepper";
import { apiFetch } from "@/lib/api";

const steps = [
  { id: "upload", label: "Upload" },
  { id: "parse", label: "Parse" },
  { id: "analyze", label: "Analyze" },
  { id: "optimize", label: "Optimize" },
];

type JdAnalysis = {
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  responsibilities: string[];
  keywords: string[];
  seniority: string;
  experience: string;
};

export default function AnalyzePageClient() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId");

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JdAnalysis | null>(null);

  const primaryKeywords = useMemo(() => {
    if (!analysis) return [];
    const set = new Set([
      ...analysis.requiredSkills,
      ...analysis.keywords.slice(0, 12),
    ]);
    return Array.from(set).slice(0, 16);
  }, [analysis]);

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      const payload = [
        role ? `Role: ${role}` : "",
        company ? `Company: ${company}` : "",
        jdText,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await apiFetch<{ data: JdAnalysis }>(
        "/job-descriptions/analyze",
        {
          method: "POST",
          body: JSON.stringify({ jobDescription: payload }),
        }
      );
      setAnalysis(res.data);
      sessionStorage.setItem("resumeai_jd_analysis", JSON.stringify(res.data));
      if (resumeId) {
        sessionStorage.setItem("resumeai_resume_id", resumeId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Job description analysis"
        description="Paste a JD to extract keywords, skills, and responsibilities."
      />

      <div className="mb-8">
        <Stepper steps={steps} current={2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job description</CardTitle>
            <CardDescription>
              We extract skills and keywords — never invent resume content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role title</Label>
                <Input
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Senior Product Designer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jd">Description</Label>
              <Textarea
                id="jd"
                className="min-h-[220px]"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here…"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button
              onClick={runAnalysis}
              disabled={analyzing || jdText.trim().length < 40}
              className="w-full sm:w-auto"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting keywords…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract keywords
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted signals</CardTitle>
            <CardDescription>
              Skills and phrases ResumeAI will score against
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {!analysis && !analyzing ? (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground"
                >
                  Run extraction to see required skills and keywords.
                </motion.p>
              ) : null}

              {analyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-40 items-center justify-center"
                >
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </motion.div>
              ) : null}

              {analysis ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {analysis.seniority || analysis.experience ? (
                    <p className="text-sm text-muted-foreground">
                      {[analysis.seniority, analysis.experience]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                  <div>
                    <p className="mb-2 text-sm font-medium">Required skills</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.requiredSkills.map((k) => (
                        <Badge key={k} variant="success">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {primaryKeywords.map((k) => (
                        <Badge key={k} variant="secondary">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Preferred / tools</p>
                    <div className="flex flex-wrap gap-2">
                      {[...analysis.preferredSkills, ...analysis.tools].map(
                        (k) => (
                          <Badge key={k} variant="warning">
                            {k}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link
                      href={
                        resumeId
                          ? `/editor?resumeId=${encodeURIComponent(resumeId)}`
                          : "/editor"
                      }
                    >
                      Optimize in editor
                    </Link>
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
