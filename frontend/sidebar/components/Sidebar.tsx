"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { NavModule } from "../types/navigation";
import { useNavigation } from "../hooks/useNavigation";
import { useSidebar } from "../hooks/useSidebar";
import { SidebarRail } from "./SidebarRail";
import { SidebarPanel } from "./SidebarPanel";

export interface SidebarProps {
  roleTier?: string;
  userName?: string;
  userEmail?: string;
  roleName?: string;
  committeeName?: string;
  initials: string;
  notificationCount?: number;
  onLogout: () => void;
  className?: string;
  mobile?: boolean;
}

export function Sidebar({
  roleTier,
  userName,
  userEmail,
  roleName,
  committeeName,
  initials,
  notificationCount = 0,
  onLogout,
  className,
  mobile = false,
}: SidebarProps) {
  const { collapseMode, setCollapseMode, setCategoryExpanded, setSearchOpen } = useSidebar();
  const isExpanded = mobile || collapseMode === "expanded";

  const dynamicBadges = useMemo(
    () =>
      notificationCount > 0
        ? { "in-app-alerts": { variant: "count" as const, value: notificationCount } }
        : undefined,
    [notificationCount]
  );

  const { railModules } = useNavigation(roleTier, dynamicBadges);

  const handleRailModuleSelect = (mod: NavModule) => {
    setCollapseMode("expanded");
    setCategoryExpanded(mod.categoryId, true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  return (
    <div
      className={cn(
        "flex h-full shrink-0 min-h-0",
        isExpanded ? "w-[calc(4.25rem+18rem)]" : "w-[4.25rem]",
        className
      )}
    >
      <SidebarRail
        modules={railModules}
        dynamicBadges={dynamicBadges}
        onExpand={() => setCollapseMode("expanded")}
        onModuleSelect={handleRailModuleSelect}
        showExpand={!isExpanded}
        showLogo={!isExpanded}
        className="h-full min-h-0"
      />
      {isExpanded && (
        <SidebarPanel
          roleTier={roleTier}
          userName={userName}
          userEmail={userEmail}
          roleName={roleName}
          committeeName={committeeName}
          initials={initials}
          onLogout={onLogout}
          onCollapse={() => setCollapseMode("compact")}
          showLogo
          className="h-full min-h-0 border-l-0"
        />
      )}
    </div>
  );
}
