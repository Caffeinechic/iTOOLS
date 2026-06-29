import type { LucideIcon } from "lucide-react";

/** How permission engine exposes a module to the sidebar UI. */
export type ModuleVisibility =
  | "visible"
  | "hidden"
  | "disabled"
  | "coming_soon"
  | "beta"
  | "admin_only"
  | "read_only";

/** Visual / interaction state for a rendered node. */
export type ModuleRenderState =
  | "normal"
  | "selected"
  | "hovered"
  | "loading"
  | "disabled"
  | "coming_soon"
  | "maintenance"
  | "beta"
  | "unread"
  | "error";

export type BadgeVariant = "count" | "live" | "new" | "beta" | "soon" | "alert";

export interface NavBadge {
  variant: BadgeVariant;
  value?: number | string;
}

export type ActiveMatch = "exact" | "prefix" | "none";

export interface PermissionRule {
  /** Minimum role tier: MASTER | LEADERSHIP | EXECUTIVE | any */
  minTier?: "MASTER" | "LEADERSHIP" | "EXECUTIVE";
  /** If true, only MASTER tier can see */
  masterOnly?: boolean;
}

export interface NavModule {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  categoryId: string;
  parentId?: string;
  sortOrder: number;
  permissions?: PermissionRule;
  badge?: NavBadge;
  visibility?: ModuleVisibility;
  activeMatch?: ActiveMatch;
  /** Show in the narrow icon rail */
  rail?: boolean;
  railOrder?: number;
  featureFlag?: string;
  keywords?: string[];
}

export interface NavCategory {
  id: string;
  label: string;
  sortOrder: number;
  icon?: LucideIcon;
  defaultExpanded?: boolean;
}

export interface ResolvedNavModule extends NavModule {
  resolvedVisibility: ModuleVisibility;
  depth: number;
  children: ResolvedNavModule[];
}

export interface ResolvedCategory {
  category: NavCategory;
  modules: ResolvedNavModule[];
}

export interface NavigationContext {
  roleTier?: string;
  pathname: string;
  dynamicBadges?: Record<string, NavBadge>;
}

export type SidebarCollapseMode = "expanded" | "compact" | "hidden";

export interface RecentPage {
  moduleId: string;
  route: string;
  label: string;
  visitedAt: number;
}

export interface FavoritePage {
  moduleId: string;
  route: string;
  label: string;
  sortOrder: number;
}
