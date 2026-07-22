"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/motion";
import { authHeaders, apiFetch } from "@/lib/api";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Try ResumeAI on a limited monthly quota.",
    features: ["3 resume uploads / mo", "5 ATS scores", "1 AI optimize"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    description: "For active job seekers optimizing every application.",
    features: [
      "Unlimited uploads",
      "Unlimited ATS + optimize",
      "Cover letters",
      "PDF & DOCX export",
      "Version history",
    ],
    highlighted: true,
  },
];

export default function BillingPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch<{ data: { plan: string } }>(
          "/billing/status",
          { headers: authHeaders() }
        );
        setPlan(res.data.plan);
      } catch {
        // logged-out or Stripe not configured
      }
    })();
  }, []);

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: { url: string } }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({}),
        headers: authHeaders(),
      });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checkout failed — configure Stripe on the API."
      );
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: { url: string } }>("/billing/portal", {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Upgrade for unlimited optimization, cover letters, and exports."
        action={<Badge variant="secondary">Current plan: {plan}</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <Card
            key={p.id}
            className={p.highlighted ? "border-primary" : undefined}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {p.highlighted ? (
                  <Sparkles className="h-4 w-4 text-primary" />
                ) : null}
                {p.name}
              </CardTitle>
              <CardDescription>{p.description}</CardDescription>
              <p className="font-display pt-2 text-3xl font-semibold">
                {p.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.id === "pro" ? (
                <Button
                  className="w-full"
                  disabled={busy || plan === "pro"}
                  onClick={startCheckout}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {plan === "pro" ? "Current plan" : "Upgrade to Pro"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={busy}
                  onClick={openPortal}
                >
                  Manage subscription
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
