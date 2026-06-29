"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRouteActive } from "../services/PermissionService";
import { useNavigation } from "../hooks/useNavigation";
import { useSidebar } from "../hooks/useSidebar";
import type { ResolvedCategory, ResolvedNavModule } from "../types/navigation";
import { SidebarCollapsibleSection } from "./SidebarCollapsibleSection";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarProfile } from "./SidebarProfile";
import { SidebarSearch } from "./SidebarSearch";

const FAVORITES_SECTION_ID = "__favorites__";

function categoryContainsPath(
  group: ResolvedCategory,
  pathname: string
): boolean {
  const visit = (mod: ResolvedNavModule): boolean => {
    if (isRouteActive(pathname, mod.route, mod.activeMatch ?? "prefix")) return true;
    return mod.children.some(visit);
  };
  return group.modules.some(visit);
}

function findActiveCategoryId(
  categories: ResolvedCategory[],
  pathname: string
): string | null {
  for (const group of categories) {
    if (categoryContainsPath(group, pathname)) {
      return group.category.id;
    }
  }
  return null;
}

interface SidebarPanelProps {
  roleTier?: string;
  userName?: string;
  userEmail?: string;
  roleName?: string;
  committeeName?: string;
  initials: string;
  onLogout: () => void;
  onCollapse: () => void;
  className?: string;
  showLogo?: boolean;
}

export function SidebarPanel({
  roleTier,
  userName,
  userEmail,
  roleName,
  committeeName,
  initials,
  onLogout,
  onCollapse,
  className,
  showLogo = true,
}: SidebarPanelProps) {
  const pathname = usePathname();
  const { categories } = useNavigation(roleTier);
  const {
    getCategoryExpanded,
    toggleCategory,
    setCategoryExpanded,
    favorites,
    toggleFavorite,
    isFavorite,
    addRecent,
    searchOpen,
    setSearchOpen,
  } = useSidebar();

  const onNavigate = useCallback(
    (mod: ResolvedNavModule) => {
      addRecent({ moduleId: mod.id, route: mod.route, label: mod.label });
    },
    [addRecent]
  );

  const onToggleFavorite = useCallback(
    (mod: ResolvedNavModule) => {
      toggleFavorite({ moduleId: mod.id, route: mod.route, label: mod.label });
    },
    [toggleFavorite]
  );

  const favoritesExpanded = getCategoryExpanded(FAVORITES_SECTION_ID, false);

  // Keep sidebar section in sync with the current page
  useEffect(() => {
    const activeCategoryId = findActiveCategoryId(categories, pathname);
    if (activeCategoryId) {
      setCategoryExpanded(activeCategoryId, true);
      requestAnimationFrame(() => {
        document
          .getElementById(`sidebar-cat-${activeCategoryId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [pathname, categories, setCategoryExpanded]);

  return (
    <>
      <div className={cn("flex flex-col h-full min-h-0 sidebar-panel w-[18rem]", className)}>
        <SidebarHeader
          committeeName={committeeName ?? "IEEE Student Branch"}
          onCollapse={onCollapse}
          onSearchOpen={() => setSearchOpen(true)}
          showLogo={showLogo}
        />

        <nav
          className="sidebar-nav-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          aria-label="Sidebar navigation"
        >
          <div className="sidebar-nav-inner">
            {favorites.length > 0 && (
              <SidebarCollapsibleSection
                label="Favorites"
                icon={Star}
                expanded={favoritesExpanded}
                onToggle={() => toggleCategory(FAVORITES_SECTION_ID, false)}
              >
                {favorites.map((fav) => {
                  const active = isRouteActive(pathname, fav.route, "prefix");
                  return (
                    <Link
                      key={fav.moduleId}
                      href={fav.route}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        active
                          ? "text-brand-accent bg-brand-accent/10"
                          : "text-muted-foreground hover:text-brand-deep hover:bg-secondary/80"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="truncate">{fav.label}</span>
                    </Link>
                  );
                })}
              </SidebarCollapsibleSection>
            )}

            {categories.map((group) => (
              <SidebarGroup
                key={group.category.id}
                group={group}
                expanded={getCategoryExpanded(
                  group.category.id,
                  group.category.defaultExpanded ?? true
                )}
                onToggle={() =>
                  toggleCategory(group.category.id, group.category.defaultExpanded ?? true)
                }
                pathname={pathname}
                onNavigate={onNavigate}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </nav>

        <SidebarProfile
          name={userName}
          email={userEmail}
          roleName={roleName}
          committeeName={committeeName}
          initials={initials}
          onLogout={onLogout}
          isMaster={roleTier === "MASTER"}
        />
      </div>

      <SidebarSearch open={searchOpen} onOpenChange={setSearchOpen} roleTier={roleTier} />
    </>
  );
}
