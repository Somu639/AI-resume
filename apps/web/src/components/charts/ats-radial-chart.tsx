"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export function AtsRadialChart({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const data = [{ name: "ATS", value: score, fill: "hsl(var(--chart-1))" }];

  return (
    <div className={cn("h-48 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="68%"
          outerRadius="100%"
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
