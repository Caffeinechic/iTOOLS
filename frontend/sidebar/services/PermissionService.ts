import type { NavModule, ModuleVisibility, NavigationContext } from "../types/navigation";

export interface UserPermissionContext {
  roleTier?: string;
}

export function resolveModuleVisibility(
  module: NavModule,
  ctx: UserPermissionContext
): ModuleVisibility {
  if (module.visibility === "coming_soon") return "coming_soon";
  if (module.visibility === "beta") return "beta";
  if (module.visibility === "hidden") return "hidden";

  const tier = ctx.roleTier ?? "EXECUTIVE";
  const rule = module.permissions;

  if (rule?.masterOnly && tier !== "MASTER") return "hidden";

  if (rule?.minTier) {
    const order = ["EXECUTIVE", "LEADERSHIP", "MASTER"] as const;
    const userIdx = order.indexOf(tier as (typeof order)[number]);
    const minIdx = order.indexOf(rule.minTier);
    if (userIdx < minIdx) return "hidden";
  }

  return module.visibility ?? "visible";
}

export function isRouteActive(
  pathname: string,
  route: string,
  activeMatch: NavModule["activeMatch"] = "prefix"
): boolean {
  if (activeMatch === "none") return false;
  if (activeMatch === "exact") return pathname === route;
  if (route === "/dashboard") return pathname === "/dashboard";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function filterVisibleModules(
  modules: NavModule[],
  ctx: UserPermissionContext
): NavModule[] {
  return modules.filter((m) => {
    const v = resolveModuleVisibility(m, ctx);
    return v !== "hidden";
  });
}

export function buildModuleTree(
  modules: NavModule[],
  ctx: NavigationContext
): import("../types/navigation").ResolvedNavModule[] {
  const permCtx: UserPermissionContext = { roleTier: ctx.roleTier };
  const visible = filterVisibleModules(modules, permCtx);
  const map = new Map<string, import("../types/navigation").ResolvedNavModule>();

  for (const mod of visible) {
    const dynamicBadge = ctx.dynamicBadges?.[mod.id];
    map.set(mod.id, {
      ...mod,
      badge: dynamicBadge ?? mod.badge,
      resolvedVisibility: resolveModuleVisibility(mod, permCtx),
      depth: 0,
      children: [],
    });
  }

  const roots: import("../types/navigation").ResolvedNavModule[] = [];

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else if (!node.parentId) {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: import("../types/navigation").ResolvedNavModule[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}
