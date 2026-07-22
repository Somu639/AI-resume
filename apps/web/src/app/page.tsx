import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { HeroVisual } from "@/components/landing/hero-visual";
import { LandingMotion } from "@/components/landing/landing-motion";

export default function LandingPage() {
  return (
    <div className="mesh-bg min-h-screen">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="container relative grid min-h-[calc(100vh-4rem)] items-center gap-12 pb-16 pt-8 lg:grid-cols-2 lg:gap-16 lg:pb-24">
        <LandingMotion>
          <div className="max-w-xl space-y-6">
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-primary uppercase">
              ResumeAI
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Fit every job description with precision.
            </h1>
            <p className="max-w-md text-base text-muted-foreground sm:text-lg">
              Upload your resume, paste a JD, and get ATS scores, keyword gaps,
              and an AI-tailored version with every change highlighted.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start optimizing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">View dashboard</Link>
              </Button>
            </div>
          </div>
        </LandingMotion>

        <HeroVisual />
      </section>
    </div>
  );
}
