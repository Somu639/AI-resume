import Link from "next/link";
import type { ComponentType } from "react";
import {
  CreditCard,
  FileSearch,
  FileText,
  LayoutDashboard,
  PenLine,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dashboardNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/analyze", label: "Analyze JD", icon: FileSearch },
  { href: "/ats-report", label: "ATS Report", icon: FileText },
  { href: "/editor", label: "Editor", icon: PenLine },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
