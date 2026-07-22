"use client";

import { motion } from "framer-motion";

export function HeroVisual() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="surface-grid absolute inset-0 rounded-3xl opacity-60" />
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-6 backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Live match</p>
            <p className="font-display text-lg font-semibold">Senior Product Designer</p>
          </div>
          <motion.div
            className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            86 ATS
          </motion.div>
        </div>

        <div className="space-y-4">
          {[
            { label: "Keyword match", value: 72 },
            { label: "Formatting", value: 91 },
            { label: "Responsibility coverage", value: 68 },
          ].map((row, i) => (
            <div key={row.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{row.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.value}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${row.value}%` }}
                  transition={{
                    duration: 0.9,
                    delay: 0.35 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Missing skills</p>
            <p className="mt-2 font-display text-2xl font-semibold">3</p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-xs text-muted-foreground">Changes highlighted</p>
            <p className="mt-2 font-display text-2xl font-semibold">12</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
