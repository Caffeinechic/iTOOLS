"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Sign up" },
] as const;

export function AuthModeTabs({ activeHref }: { activeHref: string }) {
  return (
    <nav
      className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-secondary mb-7"
      aria-label="Authentication mode"
      role="tablist"
    >
      {TABS.map((tab) => {
        const isActive = activeHref === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative z-[1] py-2.5 px-4 text-sm font-semibold rounded-xl text-center transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isActive
                ? "bg-brand text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/60"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
