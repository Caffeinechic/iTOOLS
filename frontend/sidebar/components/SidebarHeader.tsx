"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

export function SidebarHeader({
  committeeName,
  onCollapse,
  onSearchOpen,
  showCollapse = true,
  showLogo = true,
}: {
  committeeName?: string;
  onCollapse: () => void;
  onSearchOpen: () => void;
  showCollapse?: boolean;
  showLogo?: boolean;
}) {
  const [shortcut, setShortcut] = useState("Ctrl + K");

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setShortcut(isMac ? "Command + K" : "Ctrl + K");
  }, []);

  return (
    <header className="shrink-0 border-b border-border/50 bg-[hsl(var(--sidebar-bg))] px-4 py-4 flex flex-col gap-3">
      {/* Row 1: logo center, collapse right */}
      <div className="relative flex items-center justify-center w-full min-h-9">
        {showLogo ? (
          <Link href="/dashboard" className="flex items-center justify-center" aria-label="iTOOLS home">
            <BrandLogo size="sidebar" centered />
          </Link>
        ) : (
          <Link href="/dashboard" className="text-center px-8" aria-label="iTOOLS workspace">
            <p className="text-sm font-semibold text-brand-deep truncate font-display">
              {committeeName ?? "IEEE Student Branch"}
            </p>
          </Link>
        )}

        {showCollapse && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Row 2: search bar */}
      <button
        type="button"
        onClick={onSearchOpen}
        className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 text-sm text-muted-foreground hover:bg-secondary/40 transition-colors"
        aria-label="Search modules"
      >
        <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left">Search</span>
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
          {shortcut}
        </span>
      </button>
    </header>
  );
}
