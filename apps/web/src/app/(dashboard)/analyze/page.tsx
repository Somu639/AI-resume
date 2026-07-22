import { Suspense } from "react";
import AnalyzePageClient from "./analyze-client";

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AnalyzePageClient />
    </Suspense>
  );
}
