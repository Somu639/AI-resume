"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { dashboardNav, NavLink } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[260px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[260px] border-r border-border bg-sidebar transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo href="/dashboard" />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="space-y-1 px-3 py-2">
          {dashboardNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
            />
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Alex Kim</p>
              <p className="truncate text-xs text-muted-foreground">Pro plan</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button asChild variant="outline" size="sm">
            <Link href="/upload">New resume</Link>
          </Button>
          <ThemeToggle className="hidden sm:inline-flex" />
        </header>
        <Separator className="md:hidden" />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
