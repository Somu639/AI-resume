"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Stagger, StaggerItem } from "@/components/shared/motion";
import { ScoreRing } from "@/components/shared/score-ring";
import { mockResumes } from "@/lib/mock-data";
import { scoreTone } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Track uploads, ATS health, and optimized versions in one place."
        action={
          <Button asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4" />
              Upload resume
            </Link>
          </Button>
        }
      />

      <Stagger className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Resumes", value: "3", icon: FileText },
          { label: "Avg ATS score", value: "75", icon: TrendingUp },
          { label: "Optimizations", value: "6", icon: Sparkles },
          { label: "Versions", value: "7", icon: FileText },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-display text-3xl font-semibold">
                    {stat.value}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent resumes</CardTitle>
              <CardDescription>Uploaded files and generated versions</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/upload">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockResumes.map((resume) => {
              const tone = scoreTone(resume.ats);
              return (
                <Link
                  key={resume.id}
                  href="/editor"
                  className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{resume.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {resume.updatedAt} · {resume.versions} versions
                    </p>
                  </div>
                  <Badge
                    variant={
                      tone === "success"
                        ? "success"
                        : tone === "warning"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {resume.ats} ATS
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest match</CardTitle>
            <CardDescription>Senior Product Designer · Stripe</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <ScoreRing score={86} label="ATS score" />
            <Button asChild className="w-full" variant="secondary">
              <Link href="/ats-report">
                Open ATS report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
