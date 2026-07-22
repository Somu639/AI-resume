"use client";

import { Check, CheckCheck, X, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEditorStore } from "@/store/editor-store";

export function ChangeReviewPanel() {
  const changes = useEditorStore((s) => s.changes);
  const acceptChange = useEditorStore((s) => s.acceptChange);
  const rejectChange = useEditorStore((s) => s.rejectChange);
  const acceptAll = useEditorStore((s) => s.acceptAll);
  const rejectAll = useEditorStore((s) => s.rejectAll);

  const pending = changes.filter((c) => c.status === "pending").length;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>AI changes</CardTitle>
            <CardDescription>
              {changes.length
                ? `Suggestions for your JD · ${pending} pending`
                : "No suggestions yet — run optimize after JD analysis"}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={acceptAll} disabled={!pending}>
            <CheckCheck className="h-4 w-4" />
            Accept all
          </Button>
          <Button size="sm" variant="outline" onClick={rejectAll} disabled={!pending}>
            <XCircle className="h-4 w-4" />
            Reject all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence initial={false}>
          {changes.map((change) => (
            <motion.div
              key={change.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-border p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{change.section}</Badge>
                <Badge
                  variant={
                    change.type === "added"
                      ? "success"
                      : change.type === "removed"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {change.type}
                </Badge>
                <Badge
                  variant={
                    change.status === "accepted"
                      ? "success"
                      : change.status === "rejected"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {change.status}
                </Badge>
              </div>
              {change.before ? (
                <p className="mb-1 text-xs text-muted-foreground line-through">
                  {change.before}
                </p>
              ) : null}
              {change.after ? (
                <p className="text-sm text-success">{change.after}</p>
              ) : null}
              {change.reason ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Why: {change.reason}
                </p>
              ) : null}
              {change.status === "pending" ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptChange(change.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectChange(change.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
