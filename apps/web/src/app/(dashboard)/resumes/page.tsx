"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/motion";
import { apiFetch } from "@/lib/api";

type ResumeRow = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { versions: number; analyses: number };
};

export default function ResumesPage() {
  const [rows, setRows] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch<{ data: ResumeRow[] }>("/resumes");
        setRows(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load resumes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Resumes"
        description="Uploaded files, parse status, and version history counts."
        action={
          <Button asChild>
            <Link href="/upload">
              <Plus className="h-4 w-4" />
              Upload
            </Link>
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No resumes yet. Upload a PDF or DOCX to get started.
            </p>
            <Button asChild>
              <Link href="/upload">Upload resume</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{r.title}</span>
                <Badge variant="secondary">{r.status}</Badge>
              </CardTitle>
              <CardDescription>
                {new Date(r.createdAt).toLocaleString()} ·{" "}
                {r._count?.versions ?? 0} versions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/analyze?resumeId=${encodeURIComponent(r.id)}`}>
                  Analyze JD
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/editor?resumeId=${encodeURIComponent(r.id)}`}>
                  Open editor
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
