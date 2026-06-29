"use client";

import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResolvedCategory } from "../types/navigation";
import { SidebarItem } from "./SidebarItem";
import type { ResolvedNavModule } from "../types/navigation";

interface SidebarGroupProps {
  group: ResolvedCategory;
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate: (module: ResolvedNavModule) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (module: ResolvedNavModule) => void;
}

export const SidebarGroup = memo(function SidebarGroup({
  group,
  expanded,
  onToggle,
  pathname,
  onNavigate,
  isFavorite,
  onToggleFavorite,
}: SidebarGroupProps) {
  return (
    <div className="select-none" id={`sidebar-cat-${group.category.id}`}>
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
        <span className="truncate">{group.category.label}</span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-1.5 py-2.5 space-y-0.5">
            {group.modules.map((mod) => (
              <SidebarItem
                key={mod.id}
                module={mod}
                pathname={pathname}
                onNavigate={onNavigate}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
