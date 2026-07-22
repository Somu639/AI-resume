"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDropzone } from "@/components/resume/file-dropzone";
import { PageHeader } from "@/components/shared/motion";
import { Stepper } from "@/components/shared/stepper";
import { apiUpload } from "@/lib/api";

const steps = [
  { id: "upload", label: "Upload" },
  { id: "parse", label: "Parse" },
  { id: "analyze", label: "Analyze" },
  { id: "optimize", label: "Optimize" },
];

type UploadResponse = {
  data: {
    id: string;
    title: string;
    status: string;
  };
};

export default function UploadPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      throw new Error("Please sign in to upload a resume");
    }

    setUploading(true);
    setProgress(15);
    setError(null);
    setResumeId(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name.replace(/\.(pdf|docx)$/i, ""));

      setProgress(45);
      const res = await apiUpload<UploadResponse>("/resumes", form);
      setProgress(100);
      setResumeId(res.data.id);
      sessionStorage.setItem("resumeai_resume_id", res.data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Upload resume"
        description="Drop a PDF or DOCX. We’ll extract text and prepare it for JD matching."
      />

      <div className="mb-8">
        <Stepper steps={steps} current={resumeId ? 1 : 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Your file</CardTitle>
            <CardDescription>
              Supported formats: PDF, DOCX · Max size 10MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileDropzone
              onFiles={handleFiles}
              uploading={uploading}
              progress={progress}
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            {resumeId ? (
              <p className="text-sm text-success">
                Parsed and saved. Resume id: {resumeId}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
            <CardDescription>A clear path from upload to export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>1. We parse sections, skills, and experience bullets.</p>
            <p>2. You paste a job description for keyword extraction.</p>
            <p>3. ResumeAI scores ATS fit and generates an optimized version.</p>
            <Button asChild className="w-full" disabled={!resumeId && !uploading}>
              <Link
                href={
                  resumeId
                    ? `/analyze?resumeId=${encodeURIComponent(resumeId)}`
                    : "/analyze"
                }
              >
                Continue to JD analysis
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
