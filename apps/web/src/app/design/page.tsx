import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design system · ResumeAI",
  description:
    "Lumina Resume — visual evolution framework and reference screens for ResumeAI.",
};

const SCREENS = [
  {
    slug: "dashboard",
    title: "Dashboard",
    description: "Overview of resumes, ATS score, and recent activity.",
  },
  {
    slug: "upload",
    title: "Upload resume",
    description: "Drag-and-drop upload with parsing states.",
  },
  {
    slug: "analyze",
    title: "JD analysis",
    description: "Extract required skills, tools, and responsibilities.",
  },
  {
    slug: "editor",
    title: "Smart editor",
    description: "Side-by-side original vs optimized with change review.",
  },
  {
    slug: "export",
    title: "Export & download",
    description: "Pick a theme and export to PDF or DOCX.",
  },
] as const;

export default function DesignGalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          ResumeAI
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to app
        </Link>
      </header>

      <main className="container space-y-10 py-10">
        <div className="max-w-2xl space-y-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Lumina Resume
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Visual evolution framework
          </h1>
          <p className="text-muted-foreground">
            High-utility minimalism inspired by Linear and Vercel — a slate/zinc
            foundation with a deep teal accent, Geist + Inter type, and an 8pt
            spacing rhythm. Reference screens below.
          </p>
        </div>

        <div className="grid gap-8">
          {SCREENS.map((screen) => (
            <section key={screen.slug} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {screen.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {screen.description}
                  </p>
                </div>
                <a
                  href={`/design/${screen.slug}.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View HTML mockup →
                </a>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* Static design reference images from public/design */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/design/${screen.slug}.png`}
                  alt={`${screen.title} screen design`}
                  className="h-auto w-full"
                  loading="lazy"
                />
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
