"use client";

import { memo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRouteActive } from "../services/PermissionService";
import type { ResolvedNavModule } from "../types/navigation";
import { SidebarBadge } from "./SidebarBadge";

interface SidebarItemProps {
  module: ResolvedNavModule;
  pathname: string;
  depth?: number;
  onNavigate?: (module: ResolvedNavModule) => void;
  onToggleFavorite?: (module: ResolvedNavModule) => void;
  isFavorite?: (moduleId: string) => boolean;
}

export const SidebarItem = memo(function SidebarItem({
  module,
  pathname,
  depth = 0,
  onNavigate,
  onToggleFavorite,
  isFavorite,
}: SidebarItemProps) {
  const isSoon = module.resolvedVisibility === "coming_soon";
  const isDisabled = module.resolvedVisibility === "disabled" || isSoon;
  const active = isRouteActive(pathname, module.route, module.activeMatch ?? "prefix");
  const favorited = isFavorite?.(module.id);

  const rowClass = cn(
    "group flex items-center gap-2.5 rounded-xl text-sm font-medium transition-colors duration-150",
    depth > 0 ? "pl-8 pr-3 py-2.5" : "px-3 py-2.5",
    isDisabled
      ? "text-muted-foreground/60 cursor-default"
      : active
        ? "text-brand-accent bg-brand-accent/10"
        : "text-muted-foreground hover:text-brand-deep hover:bg-secondary/80"
  );

  const inner = (
    <>
      <module.icon
        className={cn("w-4 h-4 shrink-0", isDisabled && "opacity-50")}
        strokeWidth={1.75}
      />
      <span className="flex-1 truncate">{module.label}</span>
      <SidebarBadge badge={module.badge} />
      {!isDisabled && onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(module);
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity",
            favorited && "opacity-100 text-brand-accent"
          )}
          aria-label={favorited ? "Remove favorite" : "Add favorite"}
        >
          <Star className={cn("w-3 h-3", favorited && "fill-current")} />
        </button>
      )}
      {active && !isDisabled && (
        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0" aria-hidden />
      )}
    </>
  );

  return (
    <div>
      {isDisabled ? (
        <div className={rowClass} title={isSoon ? "Coming soon" : undefined}>
          {inner}
        </div>
      ) : (
        <Link
          href={module.route}
          className={rowClass}
          onClick={() => onNavigate?.(module)}
          aria-current={active ? "page" : undefined}
        >
          {inner}
        </Link>
      )}
      {module.children.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {module.children.map((child) => (
            <SidebarItem
              key={child.id}
              module={child}
              pathname={pathname}
              depth={depth + 1}
              onNavigate={onNavigate}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
});
