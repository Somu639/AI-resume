"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
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
import { MetricBar } from "@/components/shared/metric-bar";
import { ScoreBarChart } from "@/components/charts/score-bar-chart";
import { mockKeywords, scoreBreakdown } from "@/lib/mock-data";

export default function AtsReportPage() {
  return (
    <div>
      <PageHeader
        title="ATS report"
        description="Compatibility, keyword coverage, formatting, and gap analysis for your selected JD."
        action={
          <Button asChild>
            <Link href="/editor">
              Open editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <Stagger className="mb-6 grid gap-4 md:grid-cols-3">
        <StaggerItem>
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <ScoreRing score={78} label="ATS score" />
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
              <CardDescription>How each dimension contributes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreBarChart data={scoreBreakdown} />
            </CardContent>
          </Card>
        </StaggerItem>
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detailed metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <MetricBar label="ATS compatibility" value={78} />
            <MetricBar label="Keyword match" value={64} />
            <MetricBar label="Formatting score" value={85} />
            <MetricBar label="Skills coverage" value={71} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Matched keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {mockKeywords.matched.map((k) => (
                <Badge key={k} variant="success">
                  {k}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Missing skills & responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {mockKeywords.missing.map((k) => (
                  <Badge key={k} variant="warning">
                    {k}
                  </Badge>
                ))}
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Lead sprint planning with cross-functional partners</li>
                <li>• Own accessibility audits across product surfaces</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
