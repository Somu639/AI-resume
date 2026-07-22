"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = {
  id: string;
  label: string;
};

export function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex w-full items-center gap-2", className)}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-xs font-medium sm:text-sm",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "mx-1 hidden h-px flex-1 sm:block",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
