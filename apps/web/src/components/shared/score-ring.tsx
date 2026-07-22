"use client";

import { motion } from "framer-motion";
import { cn, scoreTone } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 120,
  stroke = 10,
  label = "ATS",
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = scoreTone(score);
  const color =
    tone === "success"
      ? "stroke-success"
      : tone === "warning"
        ? "stroke-warning"
        : "stroke-destructive";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-secondary"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-3xl font-semibold tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
