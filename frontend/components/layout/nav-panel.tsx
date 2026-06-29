"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  NAV_SECTIONS,
  SYSTEM_NAV,
  type SidebarNavItem,
  isNavActive,
  filterNavItems,
} from "@/lib/navigation";

function PanelLink({
  item,
  pathname,
  notificationCount,
}: {
  item: SidebarNavItem;
  pathname: string;
  notificationCount?: number;
}) {
  const active = isNavActive(pathname, item);
  const badge =
    item.id === "in-app-alerts" && notificationCount
      ? notificationCount > 9
        ? "9+"
        : notificationCount
      : item.badge;

  if (item.soon) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground/70 cursor-default"
        title="Coming soon"
      >
        <item.icon className="w-4 h-4 shrink-0 opacity-50" strokeWidth={1.75} />
        <span className="flex-1 truncate">{item.label}</span>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full font-normal">
          Soon
        </Badge>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
        active
          ? "text-brand-accent bg-brand-accent/10"
          : "text-muted-foreground hover:text-brand-deep hover:bg-secondary/80"
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      <span className="flex-1 truncate">{item.label}</span>
      {badge != null && (
        <span className="text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-accent text-brand-deep px-1">
          {badge}
        </span>
      )}
      {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0" />}
    </Link>
  );
}

export function NavPanel({
  userTier,
  notificationCount,
  className,
}: {
  userTier?: string;
  notificationCount?: number;
  className?: string;
}) {
  const pathname = usePathname();
  const isMaster = userTier === "MASTER";

  return (
    <div className={cn("flex flex-col h-full nav-panel", className)}>
      <div className="px-4 pt-5 pb-4 border-b border-border/60">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 w-full min-w-0 group"
          aria-label="iTools home"
        >
          <BrandLogo size="md" className="min-w-0 flex-1" />
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
        </Link>
        <p className="text-[11px] text-muted-foreground mt-2.5 pl-0.5 leading-snug truncate">
          IEEE Student Branch
        </p>
      </div>

      <ScrollArea className="flex-1 px-2 py-3 scrollbar-thin">
        <div className="space-y-5">
          {NAV_SECTIONS.map((section) => {
            const items = filterNavItems(section.items, userTier);
            if (!items.length) return null;

            return (
              <div key={section.title}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <PanelLink
                      key={item.id}
                      item={item}
                      pathname={pathname}
                      notificationCount={notificationCount}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {isMaster && (
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                System
              </p>
              <div className="space-y-0.5">
                {filterNavItems(SYSTEM_NAV, userTier).map((item) => (
                  <PanelLink
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    notificationCount={notificationCount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
