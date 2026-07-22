import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-display inline-flex items-center gap-2 text-lg font-semibold tracking-tight",
        className
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        R
      </span>
      <span>
        Resume<span className="text-primary">AI</span>
      </span>
    </Link>
  );
}
