import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mesh-bg grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between border-r border-border p-10 lg:flex">
        <Logo />
        <div className="max-w-md space-y-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Built for candidates who want every interview.
          </h2>
          <p className="text-muted-foreground">
            Match keywords, raise ATS scores, and export polished resumes in
            minutes — with full version history.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Trusted by product designers, engineers, and career switchers.
        </p>
      </div>
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Logo className="lg:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
