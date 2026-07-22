"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const defaultData = [
  { name: "ATS", score: 78 },
  { name: "Keywords", score: 64 },
  { name: "Format", score: 85 },
  { name: "Skills", score: 71 },
  { name: "Clarity", score: 80 },
];

export function ScoreBarChart({
  data = defaultData,
  className,
}: {
  data?: Array<{ name: string; score: number }>;
  className?: string;
}) {
  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="score" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
