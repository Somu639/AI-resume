"use client";

import { History, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/editor/html";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";

export function VersionHistoryPanel() {
  const versions = useEditorStore((s) => s.versions);
  const activeVersionId = useEditorStore((s) => s.activeVersionId);
  const restoreVersion = useEditorStore((s) => s.restoreVersion);
  const saveVersion = useEditorStore((s) => s.saveVersion);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Version history
          </CardTitle>
          <CardDescription>Restore any saved snapshot</CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => saveVersion(`Manual save · ${new Date().toLocaleTimeString()}`)}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.map((version) => (
          <button
            key={version.id}
            type="button"
            onClick={() => restoreVersion(version.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              activeVersionId === version.id
                ? "border-primary bg-accent/50"
                : "border-border hover:bg-accent/40"
            )}
          >
            <span>
              <span className="font-medium">{version.label}</span>
              <span className="text-muted-foreground"> · {version.source}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(version.createdAt)}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
