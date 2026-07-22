"use client";

import { Progress } from "@/components/ui/progress";
import { cn, scoreTone } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function MetricBar({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const tone = scoreTone(value);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Badge
          variant={
            tone === "success"
              ? "success"
              : tone === "warning"
                ? "warning"
                : "destructive"
          }
        >
          {value}%
        </Badge>
      </div>
      <Progress value={value} />
    </div>
  );
}
