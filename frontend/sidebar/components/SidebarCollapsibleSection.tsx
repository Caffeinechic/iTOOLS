"use client";

import { memo, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarCollapsibleSectionProps {
  label: string;
  icon?: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const SidebarCollapsibleSection = memo(function SidebarCollapsibleSection({
  label,
  icon: Icon,
  expanded,
  onToggle,
  children,
}: SidebarCollapsibleSectionProps) {
  return (
    <div className="select-none">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-muted-foreground transition-colors duration-150 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/25"
        aria-expanded={expanded}
      >
        <ChevronDown
          className={cn(
            "w-3 h-3 shrink-0 transition-transform duration-200",
            !expanded && "-rotate-90"
          )}
        />
        {Icon && <Icon className="w-3 h-3 shrink-0" />}
        <span className="truncate">{label}</span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-1.5 py-2.5 space-y-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
});
