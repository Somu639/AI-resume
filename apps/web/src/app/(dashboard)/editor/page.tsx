import { Suspense } from "react";
import { LiveResumeEditor } from "@/components/editor/live-resume-editor";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          Loading editor…
        </div>
      }
    >
      <LiveResumeEditor />
    </Suspense>
  );
}
